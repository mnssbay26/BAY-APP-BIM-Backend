const axios = require ("axios")

async function getBim360ProjectById (token, accountId, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    const { data: project } = await axios.get(`${process.env.AUTODESK_BASE_URL}/project/v1/hubs/${accountId}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return project;
}
module.exports = { getBim360ProjectById };