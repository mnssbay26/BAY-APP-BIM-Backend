const axios = require ("axios")

async function getBim360ProjectRfis (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    let allRfis = [];
    let url = `${process.env.AUTODESK_BASE_URL}/bim360/rfis/v2/containers/${projectId}/rfis`;

    while (url) {
        const { data: rfis } = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        allRfis = allRfis.concat(rfis.results);
        url = rfis.pagination.nextUrl;
    }
    return allRfis;
}
module.exports = { getBim360ProjectRfis };