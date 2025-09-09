const axios = require ("axios")

async function getRfisTypes (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');  
    
    const { data: rfiTypes } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/v1/projects/${projectId}/rfi-types`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return rfiTypes;
}
module.exports = { getRfisTypes };