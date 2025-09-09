const axios = require ("axios")

async function getHubById (token, hubId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!hubId) throw new Error('Hub ID is required');

    const { data: hub } = await axios.get(`${process.env.AUTODESK_BASE_URL}/project/v1/hubs/${hubId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return hub;
}
module.exports = { getHubById };

