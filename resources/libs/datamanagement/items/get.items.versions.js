const axios = require ("axios")

async function getItemsVersions (token, projectId, itemId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!itemId) throw new Error('Item ID is required');

    const { data: versions } = await axios.get(`${process.env.AUTODESK_BASE_URL}/data/v1/projects/${projectId}/items/${itemId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return versions;
}
module.exports = { getItemsVersions };