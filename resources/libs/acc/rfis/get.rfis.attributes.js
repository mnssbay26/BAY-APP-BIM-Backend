const axios = require ("axios")

async function getRfisAttributes (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    const { data: attributes } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/rfis/v3/projects/${projectId}/attributes`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return attributes;
}
module.exports = { getRfisAttributes };
