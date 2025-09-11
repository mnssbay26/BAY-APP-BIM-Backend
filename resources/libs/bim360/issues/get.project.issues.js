const axios = require ("axios")

async function getBim360ProjectIssues (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    let allIssues = [];
    let nextUrl = `${process.env.AUTODESK_BASE_URL}/issues/v2/containers/${projectId}/issues?limit=20&offset=0`;

    while (nextUrl) {
        const { data: issues } = await axios.get(nextUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });
        allIssues = allIssues.concat(issues.results);
        nextUrl = issues.pagination.nextUrl;
    }
    return allIssues;
}
module.exports = { getBim360ProjectIssues };