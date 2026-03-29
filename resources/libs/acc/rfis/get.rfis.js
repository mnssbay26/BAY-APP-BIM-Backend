const {
  fetchAllPaginatedResults,
} = require("../../../../utils/general/pagination.utils");

async function getProjectRfis(token, projectId) {
  if (!token) throw new Error("Unauthorized: No token provided");
  if (!projectId) throw new Error("Project ID is required");

  return fetchAllPaginatedResults(
    `${process.env.AUTODESK_BASE_URL}/construction/rfis/v3/projects/${projectId}/rfis`,
    token,
    {
      limit: 100,
      offset: 0,
    }
  );
}

module.exports = { getProjectRfis };
