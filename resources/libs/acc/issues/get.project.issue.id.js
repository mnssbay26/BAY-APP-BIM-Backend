const axios = require ("axios")

async function getProjectIssueId (token, projectId, issueId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!issueId) throw new Error('Issue ID is required');

    const { data: issue } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/v1/projects/${projectId}/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return issue;
}
module.exports = { getProjectIssueId };