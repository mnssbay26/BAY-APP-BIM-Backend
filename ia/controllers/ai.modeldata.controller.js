const { queryModelService } = require("../../services/dynamo/dynamo.service");
const { callMyGenAssist } = require("../../resources/libs/ai/providers/mygenassist");

// -------- limitChars (fallback) --------
let limitChars;
try {
  ({ limitChars } = require("../../libs/ai/utils"));
} catch (_) {
  limitChars = (items, max = 60000) => {
    const s = typeof items === "string" ? items : JSON.stringify(items);
    return s.length > max ? s.slice(0, max) + "\n...TRUNCATED..." : s;
  };
}

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

const stripB = (s) => (String(s).startsWith("b.") ? String(s).slice(2) : String(s));
const coerceUrn = (raw) => {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw.urn || raw.modelUrn || raw.derivativeUrn || "";
};

// Campos típicos del dataset
const KEY_CATEGORY   = "Category";
const KEY_LEVEL      = "LevelName";
const KEY_TYPENAME   = "TypeName";   // fallback: ElementType
const KEY_DISCIPLINE = "Discipline";

// Lee un valor de campo con alias
function fieldOf(r, key) {
  switch (key) {
    case KEY_CATEGORY:   return r.Category ?? null;
    case KEY_LEVEL:      return r.LevelName ?? null;
    case KEY_TYPENAME:   return r.TypeName ?? r.ElementType ?? null;
    case KEY_DISCIPLINE: return r.Discipline ?? r.discipline ?? null;
    default:             return r[key];
  }
}

function countByKey(items, key, fallback = "Unknown") {
  const map = new Map();
  for (const it of items) {
    const v = fieldOf(it, key) ?? fallback;
    map.set(v, (map.get(v) || 0) + 1);
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
}

function topN(arr, n = 3) {
  const N = Number.isFinite(+n) && +n > 0 ? +n : 3;
  return arr.slice(0, N);
}

function parseTopN(question, def = 3) {
  const m = String(question || "").match(/\btop\s+(\d{1,3})\b/i);
  return m ? parseInt(m[1], 10) : def;
}

function listDbIdsWhere(items, pred) {
  return items.filter(pred).map((r) => Number(r.dbId)).filter((x) => Number.isFinite(x));
}

function parseEqOrIncludes(question) {
  // soporta "Category=Doors", "category: Doors", "level is Level 1"
  const q = String(question || "");
  const eq = q.match(/\b(Category|LevelName|TypeName|Discipline)\s*(=|:|is)\s*("?)([^"\n\r]+?)\3?/i);
  if (!eq) return null;
  const key = eq[1];
  const raw = eq[4].trim();
  return { key, value: raw };
}

// Rango de fechas (planeadas/real)
const DATE_KEYS = [
  "PlannedStart", "PlannedEnd",
  "StartDate", "EndDate",
  "ActualStart", "ActualEnd",
];

function asDate(isoLike) {
  const d = new Date(isoLike);
  return Number.isFinite(d.getTime()) ? d : null;
}
function daterangeSummary(items) {
  let earliest = null, latest = null, count = 0;

  for (const it of items) {
    for (const k of DATE_KEYS) {
      const v = it[k];
      if (!v) continue;
      const d = asDate(v);
      if (!d) continue;
      count++;
      if (!earliest || d < earliest) earliest = d;
      if (!latest || d > latest)     latest  = d;
    }
  }
  if (!count) return "Not in provided data";
  return `Earliest: ${earliest.toISOString()} | Latest: ${latest.toISOString()} | CountWithDates: ${count}`;
}

/** Filtra registros en memoria para reducir contexto */
function filterRecords(records, { dbIds, discipline, typeName, where } = {}) {
  let out = Array.isArray(records) ? records : [];

  if (Array.isArray(dbIds) && dbIds.length) {
    const set = new Set(dbIds.map(Number));
    out = out.filter((r) => set.has(Number(r.dbId)));
  }
  if (discipline) {
    out = out.filter((r) => (r.Discipline || r.discipline) === discipline);
  }
  if (typeName) {
    const tn = String(typeName).toLowerCase();
    out = out.filter((r) => String(r.TypeName || r.ElementType || "").toLowerCase() === tn);
  }
  if (where && typeof where === "object") {
    out = out.filter((r) => {
      return Object.entries(where).every(([k, v]) => {
        const val = r[k];
        if (val == null) return false;
        if (Array.isArray(v)) {
          return v.some((x) => String(val).toLowerCase().includes(String(x).toLowerCase()));
        }
        return String(val).toLowerCase().includes(String(v).toLowerCase());
      });
    });
  }

  return out;
}

/** Construye prompt según modo */
function buildModelPrompt({ mode = "general", summary, formattedData, question }) {
  let intro;
  switch (mode) {
    case "dbid":
      intro = `You are analyzing one or more model elements. Answer strictly from the element properties.`;
      break;
    case "update":
      intro = `You help create update actions. Reply ONLY valid JSON:
{ "action":"update", "dbIds":[...], "field":"FieldName", "value":"NewValue", "discipline":"optional" }`;
      break;
    case "viewer":
      intro = `You output viewer commands. Reply ONLY valid JSON:
{ "action":"isolate"|"hide"|"highlight", "dbIds":[...] }`;
      break;
    case "daterange":
      intro = `Compute construction date ranges found in the data. Provide earliest and latest planned/actual dates with brief reasoning.`;
      break;
    default:
      intro = `You are a virtual assistant that answers questions about model data. Use ONLY the provided data. Be concise.`;
  }

  const prompt = `${intro}

Here is a brief summary of available elements:
${summary || "(no summary)"}

Detailed data (truncated if large):
${formattedData}

Question:
${question}`;

  return prompt.trim();
}

/** Resume registros para el header del prompt */
function summarize(records, take = 50) {
  return (records || [])
    .slice(0, take)
    .map((r) => `${r.dbId}: ${r.TypeName || r.ElementType || "N/A"} @ ${r.LevelName ?? "?"}`)
    .join("; ");
}

/** Formatea N registros a texto para el cuerpo del prompt */
function formatRecords(records, take = 120) {
  const slice = (records || []).slice(0, take);
  const lines = slice.map((r) =>
    Object.entries(r)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join(", ")
  );
  return limitChars(lines.join("\n---\n"), 55000);
}

/** Intenta parsear JSON cuando el modelo devuelve acciones (viewer/update) */
function tryParseJSON(s) {
  try {
    const j = JSON.parse(s);
    return j && typeof j === "object" ? j : null;
  } catch {
    return null;
  }
}

/** Carga contexto desde Dynamo con estrategia flexible (como GetModelData) */
async function getContextFlexible({ accountId, projectId, modelUrn, service = "model-data", filters }) {
  const serviceCandidates = ["model-data", "model_data"];
  const urnRaw = coerceUrn(modelUrn);
  const urnCandidates = new Set();
  if (urnRaw) {
    urnCandidates.add(urnRaw);
    try {
      const dec = decodeURIComponent(urnRaw);
      if (dec && dec !== urnRaw) urnCandidates.add(dec);
    } catch { /* ignore */ }
  }

  const acc = accountId || null;
  const proj = projectId || null;

  const idCandidates = [];
  if (acc && proj) {
    idCandidates.push({ acc, proj });
    idCandidates.push({ acc: stripB(acc), proj });
    idCandidates.push({ acc, proj: stripB(proj) });
    idCandidates.push({ acc: stripB(acc), proj: stripB(proj) });
  }

  // 1) Fase estricta (service + urn)
  if (idCandidates.length && urnCandidates.size) {
    for (const svc of serviceCandidates) {
      for (const { acc: A, proj: P } of idCandidates) {
        for (const U of urnCandidates) {
          const found = await queryModelService(A, P, svc, U);
          if (Array.isArray(found) && found.length) {
            return { full: filterRecords(found, filters), total: found.length, used: found.length, mode: "strict" };
          }
        }
      }
    }
  }

  // 2) Fallback sin URN (recupera todo el servicio del proyecto)
  if (idCandidates.length) {
    let bag = [];
    for (const svc of serviceCandidates) {
      for (const { acc: A, proj: P } of idCandidates) {
        const found = await queryModelService(A, P, svc, null, { loose: true });
        if (Array.isArray(found) && found.length) bag = bag.concat(found);
      }
    }
    if (bag.length) {
      const filtered = filterRecords(bag, filters);
      return { full: filtered, total: bag.length, used: filtered.length, mode: "loose" };
    }
  }

  // 3) Si no hay accountId o no hay nada, devolvemos vacío
  return { full: [], total: 0, used: 0, mode: "none" };
}

/* ========================= Fast-paths (intents) ========================= */
function parseIntent(question) {
  const q = String(question || "");
  const qn = norm(q);

  if (containsAny(q, ["count by category", "how many per category", "cuántos por categoría", "cuantos por categoria"]))
    return { kind: "COUNT_BY", key: KEY_CATEGORY };

  if (containsAny(q, ["count by level", "how many per level", "cuántos por nivel"]))
    return { kind: "COUNT_BY", key: KEY_LEVEL };

  if (containsAny(q, ["count by type", "count by typename", "cuántos por tipo", "cuantos por tipo"]))
    return { kind: "COUNT_BY", key: KEY_TYPENAME };

  if (containsAny(q, ["count by discipline", "cuántos por disciplina"]))
    return { kind: "COUNT_BY", key: KEY_DISCIPLINE };

  if (containsAny(q, ["top", "top "] ) && containsAny(q, ["category", "categories"]))
    return { kind: "TOP_BY", key: KEY_CATEGORY, n: parseTopN(q, 3) };

  if (containsAny(q, ["top", "top "]) && containsAny(q, ["type", "typename"]))
    return { kind: "TOP_BY", key: KEY_TYPENAME, n: parseTopN(q, 3) };

  if (containsAny(q, ["list dbids", "listar dbids", "ids where", "dbids where"]))
    return { kind: "LIST_DBIDS_WHERE" };

  if (qn.includes("list by category"))
    return { kind: "LIST_DBIDS_CATEGORY" };

  if (qn.includes("list by level"))
    return { kind: "LIST_DBIDS_LEVEL" };

  if (qn.includes("list by type") || qn.includes("list by typename"))
    return { kind: "LIST_DBIDS_TYPE" };

  if (qn.includes("date range") || qn.includes("rango de fechas") || qn.includes("daterange"))
    return { kind: "LOCAL_DATERANGE" };

  return { kind: "DEFAULT" };
}

/* ========================= Controller ========================= */
/**
 * Body:
 * {
 *   accountId?, projectId, modelUrn?, message,
 *   mode?: 'general'|'dbid'|'update'|'viewer'|'daterange',
 *   filters?: { dbIds?: number[], discipline?: string, typeName?: string, where?: Record<string,string|string[]> },
 *   limitSummary?: number, limitDetail?: number,
 *   contextData?: array // opcional: si ya viene filtrado desde el front
 * }
 *
 * Responde SIEMPRE con: { reply, data?, dbIds?, action?, discipline? }
 */
const PostAiModelData = async (req, res) => {
  try {
    // Permite que accountId/projectId/urn vengan en body o params (flexible)
    const accountId = req.body.accountId || req.params?.accountId || null;
    const projectId = req.body.projectId || req.params?.projectId || null;
    const modelUrn  = req.body.modelUrn  || req.params?.modelUrn  || null;
    const { message } = req.body;

    const {
      mode = "general",
      filters = {},
      limitSummary = 50,
      limitDetail  = 120,
      contextData
    } = req.body;

    if (!projectId || !message) {
      return res.status(400).json({
        reply: "Faltan parámetros requeridos (projectId, message).",
        error: "Bad Request"
      });
    }

    // 1) Contexto
    let records, total = 0, used = 0;
    if (Array.isArray(contextData) && contextData.length) {
      records = filterRecords(contextData, filters);
      total   = contextData.length;
      used    = records.length;
    } else {
      // Flexible como GetModelData: intenta estricto y luego loose
      const ctx = await getContextFlexible({ accountId, projectId, modelUrn, filters });
      records = ctx.full;
      total   = ctx.total;
      used    = ctx.used;
    }

    if (!records.length) {
      // ← el front usa este literal para trigger de reintento con contexto completo
      return res.status(404).json({
        reply: "No encontré elementos con ese criterio.",
        data: [],
      });
    }

    // 2) Fast-paths (solo cuando mode === "general")
    if (mode === "general") {
      const intent = parseIntent(message);

      if (intent.kind === "COUNT_BY") {
        const arr = countByKey(records, intent.key).map(({ value, count }) => ({
          key: intent.key, value, count
        }));
        const lines = arr.map((x) => `• ${x.key}: ${x.value} — ${x.count}`).join("\n");
        return res.json({ reply: `Conteo por ${intent.key} (muestras=${used}/${total}):\n${lines}`, data: arr });
      }

      if (intent.kind === "TOP_BY") {
        const n = intent.n ?? 3;
        const arr = topN(countByKey(records, intent.key), n).map(({ value, count }) => ({
          key: intent.key, value, count
        }));
        const lines = arr.map((x, i) => `${i + 1}. ${x.value} — ${x.count}`).join("\n");
        return res.json({ reply: `Top ${n} por ${intent.key}:\n${lines}`, data: arr });
      }

      if (intent.kind === "LIST_DBIDS_WHERE") {
        const kv = parseEqOrIncludes(message);
        if (kv) {
          const { key, value } = kv;
          const want = norm(value);
          const arr = listDbIdsWhere(records, (r) => norm(String(fieldOf(r, key) ?? "")).includes(want));
          return res.json({ reply: `Encontré ${arr.length} elementos para ${key} ~ "${value}".`, dbIds: arr });
        }
      }

      if (intent.kind === "LIST_DBIDS_CATEGORY") {
        const m = message.match(/category\s*(=|:|is)?\s*("?)([^"\n\r]+?)\2/i);
        if (m) {
          const want = norm(m[3]);
          const arr = listDbIdsWhere(records, (r) => norm(String(fieldOf(r, KEY_CATEGORY) ?? "")).includes(want));
          return res.json({ reply: `DBIDs en Category ~ "${m[3]}": ${arr.length}`, dbIds: arr });
        }
      }

      if (intent.kind === "LIST_DBIDS_LEVEL") {
        const m = message.match(/level(name)?\s*(=|:|is)?\s*("?)([^"\n\r]+?)\3/i);
        if (m) {
          const want = norm(m[4]);
          const arr = listDbIdsWhere(records, (r) => norm(String(fieldOf(r, KEY_LEVEL) ?? "")).includes(want));
          return res.json({ reply: `DBIDs en Level ~ "${m[4]}": ${arr.length}`, dbIds: arr });
        }
      }

      if (intent.kind === "LIST_DBIDS_TYPE") {
        const m = message.match(/type(name)?\s*(=|:|is)?\s*("?)([^"\n\r]+?)\3/i);
        if (m) {
          const want = norm(m[4]);
          const arr = listDbIdsWhere(records, (r) => norm(String(fieldOf(r, KEY_TYPENAME) ?? "")).includes(want));
          return res.json({ reply: `DBIDs en TypeName ~ "${m[4]}": ${arr.length}`, dbIds: arr });
        }
      }

      if (intent.kind === "LOCAL_DATERANGE") {
        const text = daterangeSummary(records);
        return res.json({ reply: `Construction date range:\n${text}` });
      }
    }

    // 3) LLM (para modos dbid/update/viewer/daterange o fallback general)
    const summary       = summarize(records, limitSummary);
    const formattedData = formatRecords(records, limitDetail);
    const prompt        = buildModelPrompt({ mode, summary, formattedData, question: message });

    const replyRaw = await callMyGenAssist({ prompt, model: "gpt-4o" });
    if (!replyRaw) {
      return res.status(502).json({ reply: "El asistente no respondió.", error: "UpstreamEmpty" });
    }

    // Para viewer/update devolvemos JSON como string en reply + campos extra si parsea
    if (mode === "viewer" || mode === "update") {
      const payload = tryParseJSON(replyRaw);
      if (payload) {
        // Normalizamos campos útiles para el front
        const out = {
          reply: JSON.stringify(payload),
        };
        if (Array.isArray(payload.dbIds)) out.dbIds = payload.dbIds.map(Number).filter(Number.isFinite);
        if (typeof payload.action === "string") out.action = payload.action;
        if (typeof payload.discipline === "string") out.discipline = payload.discipline;
        return res.json(out);
      }
      return res.json({ reply: String(replyRaw) });
    }

    // Para daterange o general (fallback), devolvemos texto simple
    return res.json({ reply: String(replyRaw) });

  } catch (err) {
    const status = err?.response?.status || 500;
    const detail = err?.response?.data?.detail || err?.message || "Internal server error";
    console.error("❌ AI (ModelData) error:", detail);
    return res.status(status).json({ reply: `Error: ${detail}` });
  }
};

module.exports = { PostAiModelData };