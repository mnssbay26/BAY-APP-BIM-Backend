// resources/controllers/ai/rfis.controller.js
const { queryDataService } = require("../../services/dynamo/dynamo.service");
const { callMyGenAssist } = require("../../resources/libs/ai/providers/mygenassist");

let rfisPrompt;
try {
  ({ rfisPrompt } = require("../../resources/libs/ai/prompts"));
} catch (_) {
  rfisPrompt = null;
}

// Fallback util para limitar tamaño
let limitChars;
try {
  ({ limitChars } = require("../../resources/libs/ai/utils"));
} catch (_) {
  limitChars = (items, max = 60000) => {
    const s = typeof items === "string" ? items : JSON.stringify(items);
    return s.length > max ? s.slice(0, max) + "\n...TRUNCATED..." : s;
  };
}

/* -------------------------
   Helpers
-------------------------- */

// Normaliza campos típicos de RFI
function normalizeRFI(x) {
  return {
    id: x.id || x.rfiId || x.displayId || null,
    displayId: x.displayId || x.number || null,
    title: x.title || x.subject || x.question || "",
    status: (x.status || x.state || x.stateId || "").toLowerCase(),
    priority: (x.priority || "").toLowerCase() || null,
    discipline: x.discipline || x.category || null,
    question: x.question || x.title || x.subject || "",
    createdAt: x.createdAt || x.createTime || null,
    dueDate: x.dueDate || x.due || null,
    answeredAt: x.answeredAt || null,
    closedAt: x.closedAt || null,
    createdBy: x.createdBy || x.author || null,
    assignedTo: x.assignedTo || x.owner || null,
    raw: x,
  };
}

// Intenta extraer un término entre comillas simples o dobles
function extractQuotedTerm(q) {
  const m = q.match(/["“”'`](.+?)["“”'`]/);
  return m ? m[1] : null;
}

// Quick % con 1 decimal
function pct(n, d) {
  if (!d) return "0.0%";
  return ((n * 1000) / d / 10).toFixed(1) + "%";
}

// ISO -> Date seguro
function toDate(s) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// Resumen simple por estado
function summarizeByStatus(list) {
  const out = { open: 0, answered: 0, closed: 0, other: 0 };
  list.forEach((r) => {
    const s = r.status;
    if (s === "open") out.open++;
    else if (s === "answered") out.answered++;
    else if (s === "closed") out.closed++;
    else out.other++;
  });
  const total = list.length;
  return {
    ...out,
    total,
    perc: {
      open: pct(out.open, total),
      answered: pct(out.answered, total),
      closed: pct(out.closed, total),
      other: pct(out.other, total),
    },
  };
}

// Heurísticas para responder sin LLM
function tryHeuristicsRFIs(questionRaw, itemsRaw) {
  if (!questionRaw) return null;
  const q = questionRaw.toLowerCase();
  const items = itemsRaw.map(normalizeRFI);

  // 1) "How many open RFIs" / "¿Cuántas RFIs abiertas?"
  if (/(how many|cu[aá]ntas?|cu[aá]ntos?).*(open)/.test(q) || /rfi[s]?\s+abiertas?/.test(q)) {
    const openCount = items.filter((r) => r.status === "open").length;
    return `${openCount}`;
  }

  // 2) Overdue / vencidas / due before today
  if (/overdue|vencid|due.*(before|antes).*today|antes de hoy/.test(q)) {
    const today = new Date(); today.setHours(0,0,0,0);
    const overdue = items.filter((r) => {
      const d = toDate(r.dueDate);
      return d && d < today && r.status !== "closed";
    });
    const rows = overdue.slice(0, 50).map(r => `- ${r.displayId ?? r.id}: ${r.title || "(sin título)"} (due: ${r.dueDate || "N/A"}, status: ${r.status})`);
    return rows.length ? `Overdue RFIs (${overdue.length}):\n` + rows.join("\n") : "0";
  }

  // 3) Porcentajes por estado
  if (/percentage|porcentaje/.test(q) || /(open|answered|closed).*(percentage|porcentaje)/.test(q)) {
    const s = summarizeByStatus(items);
    return [
      "| Status   | Count | %     |",
      "|---------:|------:|:-----:|",
      `| Open     | ${s.open} | ${s.perc.open} |`,
      `| Answered | ${s.answered} | ${s.perc.answered} |`,
      `| Closed   | ${s.closed} | ${s.perc.closed} |`,
      `| Other    | ${s.other} | ${s.perc.other} |`,
      `| **Total**| **${s.total}** | 100.0% |`,
    ].join("\n");
  }

  // 4) Buscar término en question/title/subject
  if (/have .* in (their )?(question|title)|contienen?/.test(q)) {
    const term = extractQuotedTerm(questionRaw) || questionRaw.split("in")[1]?.trim();
    if (term && term.length > 1) {
      const match = items.filter((r) =>
        [r.title, r.question].some((t) => String(t || "").toLowerCase().includes(term.toLowerCase()))
      );
      const rows = match.slice(0, 50).map(r => `- ${r.displayId ?? r.id}: ${r.title || "(sin título)"} [status: ${r.status}]`);
      return rows.length ? `Matches (${match.length}) for "${term}":\n` + rows.join("\n") : "[]";
    }
  }

  // 5) Top N más recientes
  if (/top\s*\d+\s*(most\s*)?(recent|recientes)|most recent|recientes/.test(q)) {
    const n = (() => {
      const m = q.match(/top\s*(\d+)/);
      return m ? Math.max(1, Math.min(50, parseInt(m[1], 10))) : 3;
    })();
    const sorted = items
      .filter((r) => !!toDate(r.createdAt))
      .sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt))
      .slice(0, n);
    const rows = sorted.map(r => `- ${r.displayId ?? r.id}: ${r.title || "(sin título)"} (createdAt: ${r.createdAt || "N/A"})`);
    return rows.length ? rows.join("\n") : "[]";
  }

  // 6) “List all open RFIs”
  if (/list.*open rfis|listar?.*rfi[s]?.*abiertas?/.test(q)) {
    const list = items.filter((r) => r.status === "open");
    if (!list.length) return "[]";
    return JSON.stringify(list.map(r => ({
      id: r.id, displayId: r.displayId, title: r.title, status: r.status, dueDate: r.dueDate
    })).slice(0, 200), null, 2);
  }

  return null;
}

// Prompt por defecto si no existe rfisPrompt
function buildRFIsPromptDefault(items, question) {
  const intro = `You are an expert RFIs assistant.

DATA SHAPE
Each item may include:
id, displayId, title, question, status ("open"|"answered"|"closed"), priority, discipline,
createdAt, dueDate, answeredAt, closedAt, createdBy, assignedTo.

RULES
- Use ONLY the provided JSON.
- Counts => return a number. Lists => return an array (IDs or objects).
- Percentages => one decimal place.
- If missing info, respond: "Not in provided data".`;

  const normalized = items.map(normalizeRFI);
  const body = limitChars(normalized, 55000);
  return `${intro}

DATA:
${typeof body === "string" ? body : JSON.stringify(body)}

QUESTION:
${question}`.trim();
}

/* -------------------------
   Controller
-------------------------- */

const PostAiRfis = async (req, res) => {
  try {
    const { accountId, projectId, service, question } = req.body;

    if (!accountId || !projectId || !service || !question) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Missing required fields: accountId, projectId, service, question",
      });
    }

    // Contexto desde Dynamo
    const items = await queryDataService(accountId, projectId, service);
    if (!items || !items.length) {
      return res.status(404).json({
        error: "Not Found",
        message: "No RFIs found for the specified account/project/service",
      });
    }

    // Heurísticas primero (para no depender siempre del LLM)
    const h = tryHeuristicsRFIs(question, items);
    if (h) {
      return res.json({ answer: h });
    }

    // Prompt (usa el de tu lib si existe; si no, uno por defecto)
    const prompt = typeof rfisPrompt === "function"
      ? rfisPrompt(items, question)
      : buildRFIsPromptDefault(items, question);

    // LLM
    const answer = await callMyGenAssist({ prompt, model: "gpt-4o" });
    if (!answer) {
      return res.status(502).json({ error: "UpstreamEmpty", message: "No response from myGenAssist" });
    }

    return res.json({ answer });
  } catch (err) {
    const status = err?.response?.status || 500;
    const detail =
      err?.response?.data?.detail ||
      err?.message ||
      "Internal server error";

    console.error("❌ AI (RFIs) error:", detail);

    // Fallback amable (no 500) con resumen
    try {
      const { accountId, projectId, service } = req.body || {};
      const items = (accountId && projectId && service)
        ? await queryDataService(accountId, projectId, service)
        : [];
      const normalized = items.map(normalizeRFI);
      const s = summarizeByStatus(normalized);
      const fallback =
        `**RFIs Summary (fallback)**\n` +
        `- Total: ${s.total}\n` +
        `- Open: ${s.open} (${s.perc.open})\n` +
        `- Answered: ${s.answered} (${s.perc.answered})\n` +
        `- Closed: ${s.closed} (${s.perc.closed})\n`;
      return res.status(200).json({ answer: fallback });
    } catch {
      return res.status(status).json({ error: detail });
    }
  }
};

module.exports = { PostAiRfis };
