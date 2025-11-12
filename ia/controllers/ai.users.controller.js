const { queryDataService } = require("../../services/dynamo/dynamo.service");
const { callMyGenAssist } = require("../../resources/libs/ai/providers/mygenassist");
const { usersPrompt } = require("../../resources/libs/ai/prompts");

/* Helpers */
function countByCompanyEntries(items) {
  const map = new Map();
  for (const u of items) {
    const key = u.companyName ?? null; // puede venir null
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => (b.count - a.count) || String(a.company).localeCompare(String(b.company)));
}

function percentInactiveString(items) {
  const total = items.length || 0;
  const inactive = items.filter(u => String(u.status || "").toLowerCase() !== "active").length;
  const pct = total ? ((inactive * 100) / total).toFixed(1) : "0.0";
  return `${inactive}/${total} (${pct}%)`;
}

function listUsersNoRoles(items) {
  return items
    .filter(u => !Array.isArray(u.roles) || u.roles.length === 0)
    .map(u => ({ id: u.id, name: u.name, companyName: u.companyName ?? null }));
}

function usersWithBothRoles(items, a = "admin", b = "viewer") {
  const has = (roles, needle) =>
    Array.isArray(roles) && roles.some(r => String(r?.name || "").toLowerCase().includes(needle));
  const A = a.toLowerCase();
  const B = b.toLowerCase();
  return items
    .filter(u => has(u.roles, A) && has(u.roles, B))
    .map(u => ({ id: u.id, name: u.name, companyName: u.companyName ?? null }));
}

function topNCompanies(items, n = 3) {
  return countByCompanyEntries(items).slice(0, n);
}

function parseIntent(q) {
  const s = String(q || "").toLowerCase();
  if ((s.includes("how many") || s.includes("cuántos") || s.includes("cuantos") || s.includes("count")) &&
      (s.includes("company") || s.includes("companies") || s.includes("compañ"))) return "COUNT_BY_COMPANY";
  if (s.includes("what percentage") || s.includes("qué porcentaje") || s.includes("que porcentaje")) return "PERCENT_INACTIVE";
  if (s.includes("no roles") || s.includes("sin roles")) return "NO_ROLES";
  if (s.includes("both") && s.includes("admin") && s.includes("viewer")) return "BOTH_ROLES";
  if (s.includes("top 3") || s.includes("top three")) return "TOP3_COMPANIES";
  return "DEFAULT";
}

function slimUserRecord(u) {
  return {
    id: u.id,
    name: u.name,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    companyName: u.companyName ?? null,
    status: u.status,
    roles: Array.isArray(u.roles) ? u.roles.map(r => r?.name).filter(Boolean) : [],
    accessLevels: Array.isArray(u.accessLevels) ? u.accessLevels : [],
  };
}

/* Controller */
const PostAiUsers = async (req, res) => {
  try {
    const { accountId, projectId, service, question } = req.body;
    if (!accountId || !projectId || !service || !question) {
      return res.status(400).json({ error: "Bad Request", message: "Missing required fields: accountId, projectId, service, question" });
    }

    const items = await queryDataService(accountId, projectId, service);
    if (!items || !items.length) {
      return res.status(404).json({ error: "Not Found", message: "No users found for the specified account/project/service" });
    }

    // Fast-paths → SIEMPRE regresan texto o arrays (nunca objeto suelto)
    const intent = parseIntent(question);
    if (intent === "COUNT_BY_COMPANY") {
      return res.json({ answer: countByCompanyEntries(items), meta: { intent } });
    }
    if (intent === "PERCENT_INACTIVE") {
      return res.json({ answer: percentInactiveString(items), meta: { intent } });
    }
    if (intent === "NO_ROLES") {
      return res.json({ answer: listUsersNoRoles(items), meta: { intent } });
    }
    if (intent === "BOTH_ROLES") {
      return res.json({ answer: usersWithBothRoles(items, "admin", "viewer"), meta: { intent } });
    }
    if (intent === "TOP3_COMPANIES") {
      return res.json({ answer: topNCompanies(items, 3), meta: { intent } });
    }

    // LLM (contexto reducido)
    const slim = items.map(slimUserRecord);
    const prompt = usersPrompt(slim, question);
    const answer = await callMyGenAssist({ prompt });
    if (!answer) return res.status(502).json({ error: "UpstreamEmpty", message: "No response from myGenAssist" });

    return res.json({ answer, meta: { intent: "LLM" } });
  } catch (err) {
    const status = err?.response?.status || 500;
    const detail = err?.response?.data || err?.message || "Internal server error";
    console.error("❌ AI (Users) error:", detail);
    return res.status(status).json({ error: detail });
  }
};

module.exports = { PostAiUsers };