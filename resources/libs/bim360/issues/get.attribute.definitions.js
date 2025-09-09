const axios = require ("axios")

async function getBim360ProjectIssuesAttributeDefinitions (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    const { data: attributesDefinitions } = await axios.get(`${process.env.AUTODESK_BASE_URL}/issues/v2/containers/${projectId}/issue-attribute-definitions`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return attributesDefinitions;
}
module.exports = { getBim360ProjectIssuesAttributeDefinitions };