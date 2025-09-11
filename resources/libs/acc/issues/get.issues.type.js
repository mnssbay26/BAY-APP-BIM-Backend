const axios = require ("axios")

async function getProjectIssuesTypes (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    const { data } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/issues/v1/projects/${projectId}/issue-types`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return data;
}
module.exports = { getProjectIssuesTypes };
