const axios = require ("axios")

async function getSubmittalsItemsSpecId (token, projectId, specId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!specId) throw new Error('Spec ID is required');

    const { data: submittalsItemsSpecId } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/submittals/v2/projects/${projectId}/specs/${specId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return submittalsItemsSpecId;
}
module.exports = { getSubmittalsItemsSpecId };
