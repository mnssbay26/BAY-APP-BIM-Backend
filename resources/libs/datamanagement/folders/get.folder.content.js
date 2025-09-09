const axios = require ("axios")

async function getFolderContent (token, projectId, folderId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!folderId) throw new Error('Folder ID is required');

    const { data: folderContent } = await axios.get(`${process.env.AUTODESK_BASE_URL}/data/v1/projects/${projectId}/folders/${folderId}/contents`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return folderContent;
}

module.exports = { getFolderContent };