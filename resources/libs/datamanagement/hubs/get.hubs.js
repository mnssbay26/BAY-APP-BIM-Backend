const axios = require ("axios")

async function getHubs (token) {
    if (!token) throw new Error('Unauthorized: No token provided');

    const { data: hubs } = await axios.get(`${process.env.AUTODESK_BASE_URL}/project/v1/hubs`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return hubs;
}   
module.exports = { getHubs };