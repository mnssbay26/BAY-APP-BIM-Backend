const axios = require ("axios")

async function getAccountCompanies (token, accountId) {
  if (!token) throw new Error('Unauthorized: No token provided');
  if (!accountId) throw new Error('Account ID is required');

  let allCompanies = [];
  let nextUrl = `${process.env.AUTODESK_BASE_URL}/construction/admin/v1/accounts/${accountId}/companies?limit=20&offset=0`;

  while (nextUrl) {
    const { data: companies } = await axios.get(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    allCompanies = allCompanies.concat(companies.results);
    nextUrl = companies.pagination.nextUrl;
  }
  return allCompanies;
}
module.exports = { getAccountCompanies };
