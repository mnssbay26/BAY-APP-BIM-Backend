const axios = require ("axios")

async function getRfisId (token, projectId, rfiId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!rfiId) throw new Error('RFI ID is required');
    
    const { data: rfi } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/v1/projects/${projectId}/rfis/${rfiId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return rfi;
}
module.exports = { getRfisId };
