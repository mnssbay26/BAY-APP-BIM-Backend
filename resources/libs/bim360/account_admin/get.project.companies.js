const {
  fetchAllPaginatedResults,
} = require("../../../../utils/general/pagination.utils");

async function getBim360ProjectCompanies(token, accountId, projectId) {
  if (!token) throw new Error("Unauthorized: No token provided");
  if (!accountId) throw new Error("Account ID is required");
  if (!projectId) throw new Error("Project ID is required");

  return fetchAllPaginatedResults(
    `${process.env.AUTODESK_BASE_URL}/hq/v1/accounts/${accountId}/projects/${projectId}/companies?limit=100&offset=0`,
    token
  );
}

module.exports = { getBim360ProjectCompanies };
