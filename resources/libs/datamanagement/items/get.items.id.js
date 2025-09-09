const axios = require ("axios")

async function getItemById (token, projectId, itemId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!itemId) throw new Error('Item ID is required');

    const { data: item } = await axios.get(`${process.env.AUTODESK_BASE_URL}/data/v1/projects/${projectId}/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return item;
}
module.exports = { getItemById };