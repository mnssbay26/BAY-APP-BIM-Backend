const axios = require ("axios")

async function getBim360FolderCustomAttributes (token, projectId, folderId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!folderId) throw new Error('Folder ID is required');

    const { data: customAttributes } = await axios.get(`${process.env.AUTODESK_BASE_URL}/bim360/docs/v1/projects/${projectId}/folders/${folderId}/custom-attribute-definitions`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return customAttributes;
}
module.exports = { getBim360FolderCustomAttributes };