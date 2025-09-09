const axios = require ("axios")

async function getBim360ProjectCompanies (token, accountId, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    let allCompanies = [];
    let nextUrl = `${process.env.AUTODESK_BASE_URL}/hq/v1/accounts/${accountId}/projects/${projectId}/companies?limit=20&offset=0`;

    while (nextUrl) {
        const { data: companies } = await axios.get(nextUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });
        allCompanies = allCompanies.concat(companies.results);
        nextUrl = companies.pagination.nextUrl;
    }
    return allCompanies;
}
module.exports = { getBim360ProjectCompanies };