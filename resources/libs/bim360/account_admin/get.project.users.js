const axios = require ("axios")

async function getBim360ProjectUsers (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    let allUsers = [];
    let nextUrl = `${process.env.AUTODESK_BASE_URL}/construction/admin/v1/projects/${projectId}/users?limit=20&offset=0`;
    while (nextUrl) {
        const { data: users } = await axios.get(nextUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });
        allUsers = allUsers.concat(users.results);
        nextUrl = users.pagination.nextUrl;
    }
    return allUsers;
}
module.exports = { getBim360ProjectUsers };