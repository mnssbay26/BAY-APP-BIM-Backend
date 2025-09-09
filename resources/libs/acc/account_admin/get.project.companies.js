const axios = require ("axios")

async function getProjectCompanies (token, projectId) {
  if (!token) throw new Error('Unauthorized: No token provided');
  if (!projectId) throw new Error('Project ID is required');

  let allCompanies = [];
  let nextUrl = `${process.env.AUTODESK_BASE_URL}/construction/admin/v1/projects/${projectId}/companies?limit=20&offset=0`;

  while (nextUrl) {
    const { data: companies } = await axios.get(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    allCompanies = allCompanies.concat(companies.results);
    nextUrl = companies.pagination.nextUrl;
  }
  return allCompanies;
}
module.exports = { getProjectCompanies };
