const axios = require ("axios")

async function getProjectIssuesAttributeDefinitions (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    const { data } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/issues/v1/projects/${projectId}/issue-attribute-definitions`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return data;
}
module.exports = { getProjectIssuesAttributeDefinitions };