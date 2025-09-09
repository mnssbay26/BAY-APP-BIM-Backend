const axios = require ("axios")

async function getBim360ProjectIssuesTypes (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    const { data: issueTypes } = await axios.get(`${process.env.AUTODESK_BASE_URL}/issues/v2/containers/${projectId}/issue-types`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return issueTypes;
}
module.exports = { getBim360ProjectIssuesTypes };
