const axios = require ("axios")

async function getProjectVersions (token, projectId, versionId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!versionId) throw new Error('Version ID is required');

    const { data: versions } = await axios.get(`${process.env.AUTODESK_BASE_URL}/data/v1/projects/${projectId}/versions/${versionId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return versions;
}   
module.exports = { getProjectVersions };