const axios = require ("axios")

async function getBim360ProjectUserId (token, projectId, userId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!userId) throw new Error('User ID is required');

    const { data: user } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/admin/v1/projects/${projectId}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return user;
}
module.exports = { getBim360ProjectUserId };