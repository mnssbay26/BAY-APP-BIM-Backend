const { queryDataService } = require("../../services/dynamo/dynamo.service");
const { callMyGenAssist } = require("../../resources/libs/ai/providers/mygenassist");
const { issuesPrompt } = require("../../resources/libs/ai/prompts");

/* ========================= Helpers ========================= */
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const containsAny = (text, arr) => {
  const t = norm(text);
  return arr.some((w) => t.includes(norm(w)));
};

const parseIntSafe = (v, d = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

const asDate = (iso) => {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
};

const isClosed = (status) => norm(status) === "closed";

const isOverdue = (issue, now = new Date()) => {
  if (isClosed(issue.status)) return false;
  const dd = asDate(issue.dueDate);
  return dd ? dd < now : false;
};

const isDueSoon = (issue, days = 7, now = new Date()) => {
  if (isClosed(issue.status)) return false;
  const dd = asDate(issue.dueDate);
  if (!dd) return false;
  const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return dd >= now && dd <= limit;
};

const slimIssueRecord = (it) => ({
  id: it.id,
  title: it.title,
  status: it.status,
  priority: it.priority ?? null,
  assignedTo: it.assignedTo ?? null,
  openedBy: it.openedBy ?? it.createdBy ?? null,
  closedBy: it.closedBy ?? null,
  createdAt: it.createdAt ?? null,
  updatedAt: it.updatedAt ?? null,
  dueDate: it.dueDate ?? null,
  closedAt: it.closedAt ?? null,
  customAttributes: Array.isArray(it.customAttributes)
    ? it.customAttributes.map((a) => ({
        title: a.title,
        readableValue: a.readableValue,
      }))
    : [],
});

/* ---------- Aggregations ---------- */
function countByStatus(items) {
  const map = new Map();
  for (const it of items) {
    const key = it.status ?? "Unknown";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
}

function countByAssignee(items) {
  const map = new Map();
  for (const it of items) {
    const key = it.assignedTo ?? "Unassigned";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .map(([assignee, count]) => ({ assignee, count }))
    .sort((a, b) => b.count - a.count || a.assignee.localeCompare(b.assignee));
}

function percentClosedString(items) {
  const total = items.length || 0;
  const closed = items.filter((i) => isClosed(i.status)).length;
  const pct = total ? ((closed * 100) / total).toFixed(1) : "0.0";
  return `${closed}/${total} (${pct}%)`;
}

function listOverdue(items, now = new Date()) {
  return items
    .filter((i) => isOverdue(i, now))
    .map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      dueDate: i.dueDate,
      assignedTo: i.assignedTo ?? "Unassigned",
    }))
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
}

function listDueSoon(items, days = 7, now = new Date()) {
  return items
    .filter((i) => isDueSoon(i, days, now))
    .map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      dueDate: i.dueDate,
      assignedTo: i.assignedTo ?? "Unassigned",
    }))
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
}

function listByStatus(items, desired) {
  const want = norm(desired);
  return items
    .filter((i) => norm(i.status) === want)
    .map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      dueDate: i.dueDate,
      assignedTo: i.assignedTo ?? "Unassigned",
    }))
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
}

function listUnassigned(items) {
  return items
    .filter((i) => !i.assignedTo)
    .map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      dueDate: i.dueDate,
      assignedTo: "Unassigned",
    }))
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
}

function topAssignees(items, n = 3) {
  return countByAssignee(items).slice(0, n);
}

/* ---------- Intent parsing ---------- */
function parseDaysWindow(question) {
  const m = String(question || "").match(/(\d+)\s*(day|days|dia|días)/i);
  return m ? parseIntSafe(m[1], 7) : 7;
}

function parseIntent(question) {
  const q = String(question || "");
  const qn = norm(q);

  if (containsAny(q, ["how many open", "cuántos abiertas", "cuantos abiertas", "count open"]) ||
      (qn.includes("count") && qn.includes("status")))
    return "COUNT_BY_STATUS";

  if (containsAny(q, ["by assignee", "por asignatario", "por responsable"]))
    return "COUNT_BY_ASSIGNEE";

  if (containsAny(q, ["overdue", "vencid"]))
    return "LIST_OVERDUE";

  if (containsAny(q, ["due soon", "por vencer", "vence en"]))
    return "LIST_DUE_SOON";

  if (containsAny(q, ["unassigned", "sin asignar"]))
    return "LIST_UNASSIGNED";

  if (containsAny(q, ["percent closed", "porcentaje cerradas", "% cerradas"]))
    return "PERCENT_CLOSED";

  if (containsAny(q, ["top 3 assignee", "top three assignee", "top asignatarios"]))
    return "TOP_ASSIGNEES";

  if (qn.includes("list") && qn.includes("open"))
    return "LIST_OPEN";

  if (qn.includes("list") && qn.includes("closed"))
    return "LIST_CLOSED";

  return "DEFAULT";
}

/* ========================= Controller ========================= */
const PostAiIssues = async (req, res) => {
  try {
    const { accountId, projectId, service, question } = req.body;

    // 1) Validación
    if (!accountId || !projectId || !service || !question) {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "Missing required fields: accountId, projectId, service, question",
      });
    }

    // 2) Contexto desde Dynamo
    const raw = await queryDataService(accountId, projectId, service);
    if (!raw || !raw.length) {
      return res.status(404).json({
        error: "Not Found",
        message: "No issues found for the specified account/project/service",
      });
    }

    // Reducimos a lo esencial para lógica + LLM
    const items = raw.map(slimIssueRecord);

    // 3) Fast-paths (respuestas instantáneas y estructuradas)
    const intent = parseIntent(question);
    if (intent === "COUNT_BY_STATUS") {
      return res.json({ answer: countByStatus(items), meta: { intent } });
    }
    if (intent === "COUNT_BY_ASSIGNEE") {
      return res.json({ answer: countByAssignee(items), meta: { intent } });
    }
    if (intent === "LIST_OVERDUE") {
      return res.json({ answer: listOverdue(items), meta: { intent } });
    }
    if (intent === "LIST_DUE_SOON") {
      const days = parseDaysWindow(question);
      return res.json({ answer: listDueSoon(items, days), meta: { intent, days } });
    }
    if (intent === "LIST_UNASSIGNED") {
      return res.json({ answer: listUnassigned(items), meta: { intent } });
    }
    if (intent === "PERCENT_CLOSED") {
      return res.json({ answer: percentClosedString(items), meta: { intent } });
    }
    if (intent === "TOP_ASSIGNEES") {
      return res.json({ answer: topAssignees(items, 3), meta: { intent } });
    }
    if (intent === "LIST_OPEN") {
      return res.json({ answer: listByStatus(items, "open"), meta: { intent } });
    }
    if (intent === "LIST_CLOSED") {
      return res.json({ answer: listByStatus(items, "closed"), meta: { intent } });
    }

    // 4) LLM (con contexto reducido)
    const prompt = issuesPrompt(items, question);
    const answer = await callMyGenAssist({ prompt });
    if (!answer) {
      return res.status(502).json({
        error: "UpstreamEmpty",
        message: "No response from myGenAssist",
      });
    }

    // 5) Respuesta
    return res.json({ answer, meta: { intent: "LLM" } });
  } catch (err) {
    const status = err?.response?.status || 500;
    const detail =
      err?.response?.data?.detail ||
      err?.message ||
      "Internal server error";
    console.error("❌ AI (Issues) error:", detail);
    return res.status(status).json({ error: detail });
  }
};

module.exports = { PostAiIssues };