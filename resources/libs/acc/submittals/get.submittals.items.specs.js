const axios = require ("axios")

async function getSubmittalsItemSpecs (token, projectId,) {

    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    const { data: submittalsItemsSpecs } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/submittals/v2/projects/${projectId}/specs`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return submittalsItemsSpecs;
}
module.exports = { getSubmittalsItemSpecs };