const {
  fetchAllPaginatedResults,
} = require("../../../../utils/general/pagination.utils");

async function getProjectCompanies (token, accountId, projectId) {
  if (!token) throw new Error('Unauthorized: No token provided');
  if (!accountId) throw new Error('Account ID is required');
  if (!projectId) throw new Error('Project ID is required');

  return fetchAllPaginatedResults(
    `	https://developer.api.autodesk.com/hq/v1/accounts/${accountId}/projects/${projectId}/companies?limit=20&offset=0`,
    token
  );
}
module.exports = { getProjectCompanies };
