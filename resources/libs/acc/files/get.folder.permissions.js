const axios = require ("axios")

async function getProjectFolderPermissions (token, projectId, folderId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!folderId) throw new Error('Folder ID is required');

    let allPermissions = [];
    let nextUrl = `${process.env.AUTODESK_BASE_URL}/data/v1/projects/${projectId}/folders/${folderId}/permissions?limit=20&offset=0`;

    while (nextUrl) {
        const { data: permissions } = await axios.get(nextUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });
        allPermissions = allPermissions.concat(permissions.results);
        nextUrl = permissions.pagination.nextUrl;
    }
    return allPermissions;
}
module.exports = { getProjectFolderPermissions };
