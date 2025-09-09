const axios = require ("axios")

async function getBim360RfisId (token, projectId, rfiId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!rfiId) throw new Error('RFI ID is required');
    
    const { data: rfi } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/rfis/v3/projects/${projectId}/rfis/${rfiId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return rfi;
}
module.exports = { getBim360RfisId };