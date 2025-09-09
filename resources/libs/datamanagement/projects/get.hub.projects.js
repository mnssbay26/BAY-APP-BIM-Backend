const axios = require ("axios")

async function getHubProjects (token, hubId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!hubId) throw new Error('Hub ID is required');

    const { data: projects } = await axios.get(`${process.env.AUTODESK_BASE_URL}/project/v1/hubs/${hubId}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return projects;
}
module.exports = { getHubProjects };