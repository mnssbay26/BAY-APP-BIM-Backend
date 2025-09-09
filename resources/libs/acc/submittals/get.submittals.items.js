const axios = require ("axios")

async function getSubmittalsItems (token, projectId,) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    const { data: submittalsItems } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/submittals/v2/projects/${projectId}/items`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return submittalsItems;
}
module.exports = { getSubmittalsItems };
