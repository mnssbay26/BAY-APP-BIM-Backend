const axios = require ("axios")

async function getProjectIssuesAttributesMappings (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    const { data: attributesMappings } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/v1/projects/${projectId}/issue-attribute-mappings`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return attributesMappings;
}
module.exports = { getProjectIssuesAttributesMappings };