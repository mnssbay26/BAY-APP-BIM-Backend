const { queryDataService } = require("../../services/dynamo/dynamo.service");
const { callMyGenAssist } = require("../../resources/libs/ai/providers/mygenassist");
const { submittalsPrompt } = require("../../resources/libs/ai/prompts");

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

const isClosed = (state) => norm(state) === "closed";

const isOverdue = (item, now = new Date()) => {
  if (isClosed(item.state)) return false;
  const dd = asDate(item.dueDate);
  return dd ? dd < now : false;
};

const isDueSoon = (item, days = 7, now = new Date()) => {
  if (isClosed(item.state)) return false;
  const dd = asDate(item.dueDate);
  if (!dd) return false;
  const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return dd >= now && dd <= limit;
};

const slimSubmittalRecord = (s) => ({
  id: s.id,
  identifier: s.identifier ?? null,
  title: s.title ?? null,
  description: s.description ?? null,
  state: s.state ?? null,
  priority: s.priority ?? null,
  createdAt: s.createdAt ?? null,
  dueDate: s.dueDate ?? null,
  updatedAt: s.updatedAt ?? null,
  createdByName: s.createdByName ?? null,
  submitterByName: s.submitterByName ?? null,
  managerName: s.managerName ?? null,
  updatedByName: s.updatedByName ?? null,
  publishedByName: s.publishedByName ?? null,
  sentToReviewByName: s.sentToReviewByName ?? null,
  specIdentifier: s.specIdentifier ?? null,
  specTitle: s.specTitle ?? null,
  customAttributes: Array.isArray(s.customAttributes)
    ? s.customAttributes.map((a) => ({
        attributeDefinitionId: a.attributeDefinitionId,
        readableValue: a.readableValue,
      }))
    : [],
});

/* ---------- Aggregations ---------- */
function countBy(items, key, fallback = "Unknown") {
  const map = new Map();
  for (const it of items) {
    const val = it[key] ?? fallback;
    map.set(val, (map.get(val) || 0) + 1);
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
}

function countByState(items) {
  return countBy(items, "state").map(({ value, count }) => ({ state: value, count }));
}

function countByPriority(items) {
  return countBy(items, "priority").map(({ value, count }) => ({ priority: value, count }));
}

function countByManager(items) {
  return countBy(items, "managerName", "Unassigned").map(({ value, count }) => ({
    manager: value,
    count,
  }));
}

function countBySpec(items) {
  const map = new Map();
  for (const it of items) {
    const key =
      it.specIdentifier || it.specTitle
        ? `${it.specIdentifier || ""} ${it.specTitle || ""}`.trim()
        : "No Spec";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .map(([spec, count]) => ({ spec, count }))
    .sort((a, b) => b.count - a.count || a.spec.localeCompare(b.spec));
}

function percentClosedString(items) {
  const total = items.length || 0;
  const closed = items.filter((i) => isClosed(i.state)).length;
  const pct = total ? ((closed * 100) / total).toFixed(1) : "0.0";
  return `${closed}/${total} (${pct}%)`;
}

function listOverdue(items, now = new Date()) {
  return items
    .filter((i) => isOverdue(i, now))
    .map((i) => ({
      id: i.id,
      identifier: i.identifier,
      title: i.title,
      state: i.state,
      dueDate: i.dueDate,
      managerName: i.managerName ?? "Unassigned",
    }))
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
}

function listDueSoon(items, days = 7, now = new Date()) {
  return items
    .filter((i) => isDueSoon(i, days, now))
    .map((i) => ({
      id: i.id,
      identifier: i.identifier,
      title: i.title,
      state: i.state,
      dueDate: i.dueDate,
      managerName: i.managerName ?? "Unassigned",
    }))
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
}

function listUnassignedManager(items) {
  return items
    .filter((i) => !i.managerName)
    .map((i) => ({
      id: i.id,
      identifier: i.identifier,
      title: i.title,
      state: i.state,
      dueDate: i.dueDate,
      managerName: "Unassigned",
    }))
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
}

function listByState(items, desired) {
  const want = norm(desired);
  return items
    .filter((i) => norm(i.state) === want)
    .map((i) => ({
      id: i.id,
      identifier: i.identifier,
      title: i.title,
      state: i.state,
      dueDate: i.dueDate,
      managerName: i.managerName ?? "Unassigned",
    }))
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
}

function topN(arr, n = 3) {
  return arr.slice(0, n);
}

/* ---------- Intent parsing ---------- */
function parseDaysWindow(question) {
  const m = String(question || "").match(/(\d+)\s*(day|days|día|días)/i);
  return m ? parseIntSafe(m[1], 7) : 7;
}

function parseIntent(question) {
  const q = String(question || "");
  const qn = norm(q);

  if (containsAny(q, ["how many by state", "conteo por estado", "count by state"]))
    return "COUNT_BY_STATE";

  if (containsAny(q, ["by priority", "por prioridad"]))
    return "COUNT_BY_PRIORITY";

  if (containsAny(q, ["by manager", "por manager", "por responsable"]))
    return "COUNT_BY_MANAGER";

  if (containsAny(q, ["by spec", "por especificacion", "por especificación", "by specification"]))
    return "COUNT_BY_SPEC";

  if (containsAny(q, ["overdue", "vencid"]))
    return "LIST_OVERDUE";

  if (containsAny(q, ["due soon", "por vencer", "vence en"]))
    return "LIST_DUE_SOON";

  if (containsAny(q, ["unassigned manager", "sin manager", "sin responsable"]))
    return "LIST_UNASSIGNED_MANAGER";

  if (containsAny(q, ["percent closed", "porcentaje cerrados", "% cerrados"]))
    return "PERCENT_CLOSED";

  if (containsAny(q, ["top 3 managers", "top three managers", "top managers"]))
    return "TOP3_MANAGERS";

  if (containsAny(q, ["top 3 specs", "top three specs", "top specs"]))
    return "TOP3_SPECS";

  if (qn.includes("list") && qn.includes("open"))
    return "LIST_OPEN";

  if (qn.includes("list") && qn.includes("closed"))
    return "LIST_CLOSED";

  return "DEFAULT";
}

/* ========================= Controller ========================= */
const PostAiSubmittals = async (req, res) => {
  try {
    const { accountId, projectId, service, question } = req.body;

    // Validaciones
    if (!accountId || !projectId || !service || !question) {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "Missing required fields: accountId, projectId, service, question",
      });
    }

    // Datos desde Dynamo
    const raw = await queryDataService(accountId, projectId, service);
    if (!raw || !raw.length) {
      return res.status(404).json({
        error: "Not Found",
        message: "No submittals found for the specified account/project/service",
      });
    }

    // Reducimos para fast-paths y LLM
    const items = raw.map(slimSubmittalRecord);

    // Fast-paths
    const intent = parseIntent(question);

    if (intent === "COUNT_BY_STATE") {
      return res.json({ answer: countByState(items), meta: { intent } });
    }
    if (intent === "COUNT_BY_PRIORITY") {
      return res.json({ answer: countByPriority(items), meta: { intent } });
    }
    if (intent === "COUNT_BY_MANAGER") {
      return res.json({ answer: countByManager(items), meta: { intent } });
    }
    if (intent === "COUNT_BY_SPEC") {
      return res.json({ answer: countBySpec(items), meta: { intent } });
    }
    if (intent === "LIST_OVERDUE") {
      return res.json({ answer: listOverdue(items), meta: { intent } });
    }
    if (intent === "LIST_DUE_SOON") {
      const days = parseDaysWindow(question);
      return res.json({ answer: listDueSoon(items, days), meta: { intent, days } });
    }
    if (intent === "LIST_UNASSIGNED_MANAGER") {
      return res.json({ answer: listUnassignedManager(items), meta: { intent } });
    }
    if (intent === "PERCENT_CLOSED") {
      return res.json({ answer: percentClosedString(items), meta: { intent } });
    }
    if (intent === "TOP3_MANAGERS") {
      return res.json({ answer: topN(countByManager(items), 3), meta: { intent } });
    }
    if (intent === "TOP3_SPECS") {
      return res.json({ answer: topN(countBySpec(items), 3), meta: { intent } });
    }
    if (intent === "LIST_OPEN") {
      return res.json({ answer: listByState(items, "open"), meta: { intent } });
    }
    if (intent === "LIST_CLOSED") {
      return res.json({ answer: listByState(items, "closed"), meta: { intent } });
    }

    // LLM (fallback)
    const prompt = submittalsPrompt(items, question);
    const answer = await callMyGenAssist({ prompt });
    if (!answer) {
      return res.status(502).json({
        error: "UpstreamEmpty",
        message: "No response from myGenAssist",
      });
    }

    return res.json({ answer, meta: { intent: "LLM" } });
  } catch (err) {
    const status = err?.response?.status || 500;
    const detail =
      err?.response?.data?.detail ||
      err?.message ||
      "Internal server error";
    console.error("❌ AI (Submittals) error:", detail);
    return res.status(status).json({ error: detail });
  }
};

module.exports = { PostAiSubmittals };