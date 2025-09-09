const axios = require ("axios")

async function getProjectTopFolder (token, hubId, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!hubId) throw new Error('Hub ID is required');
    if (!projectId) throw new Error('Project ID is required');

    const { data: folder } = await axios.get(`${process.env.AUTODESK_BASE_URL}/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return folder;
}

module.exports = { getProjectTopFolder };