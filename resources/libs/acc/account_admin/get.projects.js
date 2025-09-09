const axios = require ("axios")

async function getAccountProjects (token, accountId) {
  if (!token) throw new Error('Unauthorized: No token provided');
  if (!accountId) throw new Error('Account ID is required');

    let allProjects = [];
    let nextUrl = `${process.env.AUTODESK_BASE_URL}/construction/admin/v1/accounts/${accountId}/projects?limit=20&offset=0`;

    while (nextUrl) {
      const { data: projects } = await axios.get(nextUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
        allProjects = allProjects.concat(projects.results);
        nextUrl = projects.pagination.nextUrl;
    }
    return allProjects;
}
module.exports = { getAccountProjects };
