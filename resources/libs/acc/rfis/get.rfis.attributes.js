const {
  fetchCompletePaginatedResponse,
} = require("../../../../utils/general/pagination.utils");

async function getRfisAttributes (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    return fetchCompletePaginatedResponse(
      `${process.env.AUTODESK_BASE_URL}/construction/rfis/v3/projects/${projectId}/attributes`,
      token
    );
}
module.exports = { getRfisAttributes };
