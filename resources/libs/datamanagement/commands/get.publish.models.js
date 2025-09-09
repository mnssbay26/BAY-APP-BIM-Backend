const axios = require ("axios")

async function postPublishModels (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    const { data: publishModels } = await axios.post(`${process.env.AUTODESK_BASE_URL}/data/v1/projects/${projectId}/commands`, {}, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return publishModels;
}
module.exports = { postPublishModels };