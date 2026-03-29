const {
  fetchAllPaginatedResults,
} = require("../../../../utils/general/pagination.utils");

async function getAccountCompanies (token, accountId) {
  if (!token) throw new Error('Unauthorized: No token provided');
  if (!accountId) throw new Error('Account ID is required');

  return fetchAllPaginatedResults(
    `${process.env.AUTODESK_BASE_URL}/construction/admin/v1/accounts/${accountId}/companies?limit=20&offset=0`,
    token
  );
}
module.exports = { getAccountCompanies };
