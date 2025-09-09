const axios = require ("axios")

async function getSubmittalsItemsTypes (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    const { data: submittalsItemsTypes } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/submittals/v2/projects/${projectId}/item-types`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return submittalsItemsTypes;
}
module.exports = { getSubmittalsItemsTypes };