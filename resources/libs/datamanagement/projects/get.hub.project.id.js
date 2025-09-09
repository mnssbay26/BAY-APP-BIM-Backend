const axios = require('axios');

async function getHubProjectId (token, hubId, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!hubId) throw new Error('Hub ID is required');

    const { data: project } = await axios.get(`${process.env.AUTODESK_BASE_URL}/project/v1/hubs/${hubId}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return project.data.id;
}

module.exports = { getHubProjectId };