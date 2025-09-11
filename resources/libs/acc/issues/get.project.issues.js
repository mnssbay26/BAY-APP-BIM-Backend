const axios = require ("axios")

async function getProjectIssues (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    let allIssues = [];
    let nextUrl = `${process.env.AUTODESK_BASE_URL}/construction/issues/v1/projects/${projectId}/issues?limit=20&offset=0`;

    while (nextUrl) {
    const { data } = await axios.get(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const chunk =
      (Array.isArray(data?.results) && data.results) ||
      (Array.isArray(data?.data) && data.data) ||
      [];

    allIssues = allIssues.concat(chunk);

    nextUrl = data?.pagination?.nextUrl || data?.links?.next?.href || null;
  }

  return allIssues;
}
module.exports = { getProjectIssues };