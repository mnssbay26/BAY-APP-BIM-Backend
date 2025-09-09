const axios = require ("axios")

async function getBim360ProjectById (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    const { data: project } = await axios.get(`${process.env.AUTODESK_BASE_URL}/construction/admin/v1/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return project;
}
module.exports = { getBim360ProjectById };