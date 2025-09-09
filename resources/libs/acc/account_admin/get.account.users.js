const axios = require ("axios")

async function getAccountUsers (token, accountId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!accountId) throw new Error('Account ID is required');

    let allUsers = [];
    let nextUrl = `${process.env.AUTODESK_BASE_URL}/construction/admin/v1/accounts/${accountId}/users?limit=20&offset=0`;

    while (nextUrl) {
        const { data: users } = await axios.get(nextUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });
        allUsers = allUsers.concat(users.results);
        nextUrl = users.pagination.nextUrl;
    }
    return allUsers;
}
module.exports = { getAccountUsers };
