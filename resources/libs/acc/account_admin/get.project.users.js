const {
  fetchAllPaginatedResults,
} = require("../../../../utils/general/pagination.utils");

async function getProjectUsers (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    return fetchAllPaginatedResults(
      `${process.env.AUTODESK_BASE_URL}/construction/admin/v1/projects/${projectId}/users?limit=20&offset=0`,
      token
    );
}
module.exports = { getProjectUsers };
