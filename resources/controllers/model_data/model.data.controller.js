// controllers/platforms/bim360/model.data.controller.js
const {
  saveModelItem,
  deleteModelItem,
  queryModelService,
  updateModelItem,
  PK_ATTR,
  MODEL_SK_ATTR,
} = require("../../../services/dynamo/dynamo.service");

const { sanitize } = require("../../../utils/general/sanitaze.db");

// helpers
const normalizeService = (s) =>
  String(s || "model-data").toLowerCase().replace(/_/g, "-");

const coerceUrn = (raw) => {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw.urn || raw.modelUrn || raw.derivativeUrn || "";
};

const stripB = (s) => (String(s).startsWith("b.") ? String(s).slice(2) : String(s));

// normalización tolerante (espacios, guiones, acentos, mayúsculas, typos/US-UK)
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const canonical = (s) => {
  let n = norm(s);
  if (!n) return "";
  // US ➜ UK y typo común
  n = n.replace(/\baluminum\b/g, "aluminium");
  if (n === "aluminium wirks") n = "aluminium works";
  return n;
};

/* -------------------- POST -------------------- */
const PostModelData = async (req, res) => {
  const { accountId, projectId } = req.params;
  const { service, modelUrn, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items provided" });
  }

  const svc = normalizeService(service);
  const urn = coerceUrn(modelUrn);
  if (!urn) return res.status(400).json({ error: "modelUrn is required" });

  try {
    const sanitizedItems = items.map((item) => {
      const out = {};
      for (const [k, v] of Object.entries(item)) {
        out[k] = typeof v === "string" && isNaN(Number(v)) ? sanitize(v) : v;
      }
      // guarda una clave canónica no disruptiva para consultas robustas
      if (out.Discipline != null) {
        out.DisciplineKey = canonical(out.Discipline);
      }
      return out;
    });

    await Promise.all(
      sanitizedItems.map((item) =>
        saveModelItem({
          [PK_ATTR]: `${accountId}#${projectId}`,
          [MODEL_SK_ATTR]: `${svc}#${urn}#${item.dbId}`,
          ...item,
        })
      )
    );

    res.json({ message: "Model data saved (and sanitized)." });
  } catch (err) {
    console.error("Error creating model data:", err);
    res
      .status(500)
      .json({ data: null, error: err.message, message: "Failed to create model data" });
  }
};

/* -------------------- GET -------------------- */
const GetModelData = async (req, res) => {
  const { accountId, projectId } = req.params;
  const rawUrn = String(req.query.modelUrn || "").trim();
  const disciplineFilter = req.query.discipline;

  if (!rawUrn) return res.status(400).json({ error: "modelUrn query param is required" });

  const serviceCandidates = ["model-data", "model_data"];

  const urnCandidates = new Set([rawUrn]);
  try {
    const dec = decodeURIComponent(rawUrn);
    if (dec && dec !== rawUrn) urnCandidates.add(dec);
  } catch { /* ignore */ }

  const idCandidates = [
    { acc: accountId,         proj: projectId },
    { acc: stripB(accountId), proj: projectId },
    { acc: accountId,         proj: stripB(projectId) },
    { acc: stripB(accountId), proj: stripB(projectId) },
  ];

  try {
    let items = [];
    let matched = false;

    // 1) intento estricto: servicio + URN exacto
    outer: for (const svc of serviceCandidates) {
      for (const { acc, proj } of idCandidates) {
        for (const urn of urnCandidates) {
          const found = await queryModelService(acc, proj, svc, urn);
          if (found && found.length) {
            items = found;
            matched = true;
            break outer;
          }
        }
      }
    }

    // 2) fallback sin URN (recupera TODO el servicio de ese proyecto)
    if (!matched) {
      const bag = [];
      for (const svc of serviceCandidates) {
        for (const { acc, proj } of idCandidates) {
          const found = await queryModelService(acc, proj, svc, null, { loose: true });
          if (found && found.length) bag.push(...found);
        }
      }
      items = bag;
    }

    // 3) filtro tolerante por disciplina (si viene)
    if (disciplineFilter) {
      const needle = canonical(disciplineFilter);
      items = (items || []).filter((i) => {
        const a = canonical(i?.Discipline);
        const b = canonical(i?.DisciplineKey);
        return a === needle || b === needle;
      });
      // log mínimo para depurar sin ruido
      const sample = [...new Set((items || []).slice(0, 10).map(x => canonical(x?.Discipline)))];
      console.debug("[GetModelData] discipline:", needle, "sample:", sample);
    }

    res.json({ data: items || [] });
  } catch (err) {
    console.error("Error fetching model data:", err);
    res
      .status(500)
      .json({ data: null, error: err.message, message: "Failed to fetch model data" });
  }
};

/* -------------------- DELETE -------------------- */
const DeleteModelData = async (req, res) => {
  const { accountId, projectId, dbId } = req.params;
  const { service, modelUrn } = req.body;

  const svc = normalizeService(service);
  const urn = coerceUrn(modelUrn);
  if (!svc || !urn) return res.status(400).json({ error: "service and modelUrn are required in body" });

  try {
    await deleteModelItem(accountId, projectId, svc, urn, dbId);
    res.json({ message: "Model data deleted." });
  } catch (err) {
    console.error("Error deleting model data:", err);
    res
      .status(500)
      .json({ data: null, error: err.message, message: "Failed to delete model data" });
  }
};

/* -------------------- PATCH -------------------- */
const PatchModelData = async (req, res) => {
  const { accountId, projectId, dbId } = req.params;
  const { service, modelUrn, updates } = req.body;

  const svc = normalizeService(service);
  const urn = coerceUrn(modelUrn);
  if (!svc || !urn || typeof updates !== "object")
    return res.status(400).json({ error: "service, modelUrn and updates are required" });

  try {
    await updateModelItem(accountId, projectId, svc, urn, dbId, updates);
    res.json({ message: "Model data updated." });
  } catch (err) {
    console.error("Error updating model data:", err);
    res
      .status(500)
      .json({ data: null, error: err.message, message: "Failed to update model data" });
  }
};

module.exports = { PostModelData, GetModelData, DeleteModelData, PatchModelData };
