const {
  getAssets,
  getCategories,
  getStatuses,
} = require("../../libs/acc/assets/index");

// ─── Helper: obtiene todos los assets recursivamente via cursorState ──────────

// ─── getAssetsEnriched ────────────────────────────────────────────────────────
const getAssetsEnriched = async (req, res) => {
  const token = req.cookies["access_token"];
  let projectId = req.params.projectId;

  if (projectId && projectId.startsWith("b.")) {
    projectId = projectId.substring(2);
  }

  if (!token) {
    return res.status(401).json({ data: null, error: "Unauthorized", message: "No token" });
  }

  const filters = {};
  if (req.query.filterIsActive   !== undefined) filters.filterIsActive   = req.query.filterIsActive;
  if (req.query.filterCategoryId)               filters.filterCategoryId = req.query.filterCategoryId;
  if (req.query.filterStatusId)                 filters.filterStatusId   = req.query.filterStatusId;
  if (req.query.filterLocationId)               filters.filterLocationId = req.query.filterLocationId;

  try {
    const [allAssets, categoriesResult, statusesResult] = await Promise.all([
      getAssets(token, projectId, { limit: 200, ...filters }),
      getCategories(token, projectId).catch((e) => { console.warn("categories:", e.message); return []; }),
      getStatuses(token, projectId).catch((e)   => { console.warn("statuses:", e.message);   return []; }),
    ]);

    const categories = Array.isArray(categoriesResult) ? categoriesResult : [];
    const statuses   = Array.isArray(statusesResult)   ? statusesResult   : [];

    const categoryMap = categories.reduce((acc, cat) => { acc[cat.id] = cat; return acc; }, {});
    const statusMap   = statuses.reduce((acc, s)     => { acc[s.id] = s;   return acc; }, {});

    const results = allAssets.map((asset) => {
      const enriched = { ...asset };

      if (asset.categoryId && categoryMap[asset.categoryId]) {
        enriched.categoryName = categoryMap[asset.categoryId].name;
      }

      if (asset.statusId && statusMap[asset.statusId]) {
        const s = statusMap[asset.statusId];
        enriched.statusName  = s.label || s.name || s.description || asset.statusId;
        enriched.statusColor = s.color || null;
      } else {
        enriched.statusName  = "—";
        enriched.statusColor = null;
      }

      return enriched;
    });

    return res.status(200).json({
      results,
      meta: {
        totalLoaded:           results.length,
        totalCategoriesLoaded: categories.length,
        totalStatusesLoaded:   statuses.length,
      },
    });
  } catch (err) {
    console.error("Error fetching assets:", err.message);
    if (err.response) console.error("APS response:", err.response.data);
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to fetch assets",
    });
  }
};

// ─── getAssetsSummary ─────────────────────────────────────────────────────────
const getAssetsSummary = async (req, res) => {
  const token = req.cookies["access_token"];
  let projectId = req.params.projectId;

  if (projectId && projectId.startsWith("b.")) {
    projectId = projectId.substring(2);
  }

  if (!token) {
    return res.status(401).json({ data: null, error: "Unauthorized", message: "No token" });
  }

  try {
    const allAssets = await getAssets(token, projectId, { limit: 200 });

    // Load categories and statuses for name resolution
    const [categoriesResult, statusesResult] = await Promise.allSettled([
      getCategories(token, projectId),
      getStatuses(token, projectId),
    ]);

    const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
    const statuses   = statusesResult.status   === "fulfilled" ? statusesResult.value   : [];

    const categoryMap = categories.reduce((acc, cat) => { acc[cat.id] = cat; return acc; }, {});
    const statusMap   = statuses.reduce((acc, s)   => { acc[s.id] = s;   return acc; }, {});

    // Aggregate counts
    const byCategoryRaw = {};
    const byStatusRaw   = {};
    let activeAssets   = 0;
    let inactiveAssets = 0;

    for (const asset of allAssets) {
      if (asset.isActive === false) {
        inactiveAssets++;
      } else {
        activeAssets++;
      }

      if (asset.categoryId) {
        byCategoryRaw[asset.categoryId] = (byCategoryRaw[asset.categoryId] || 0) + 1;
      }

      if (asset.statusId) {
        byStatusRaw[asset.statusId] = (byStatusRaw[asset.statusId] || 0) + 1;
      }
    }

    const byCategory = Object.entries(byCategoryRaw).map(([categoryId, count]) => ({
      categoryId,
      categoryName: categoryMap[categoryId]?.name || "Unknown",
      count,
    }));

    const byStatus = Object.entries(byStatusRaw).map(([statusId, count]) => ({
      statusId,
      statusName:  statusMap[statusId]?.label || statusMap[statusId]?.name || "Unknown",
      statusColor: statusMap[statusId]?.color || null,
      count,
    }));

    return res.status(200).json({
      totalAssets:   allAssets.length,
      activeAssets,
      inactiveAssets,
      byCategory,
      byStatus,
    });
  } catch (err) {
    console.error("Error fetching assets summary:", err.message);
    if (err.response) console.error("APS response:", err.response.data);
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to fetch assets summary",
    });
  }
};

module.exports = { getAssetsEnriched, getAssetsSummary };
