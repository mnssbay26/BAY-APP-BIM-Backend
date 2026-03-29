const {
  fetchCompletePaginatedResponse,
} = require("../../../../utils/general/pagination.utils");

async function getSubmittalsItemSpecs (token, projectId,) {

    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    return fetchCompletePaginatedResponse(
      `${process.env.AUTODESK_BASE_URL}/construction/submittals/v2/projects/${projectId}/specs`,
      token
    );
}
module.exports = { getSubmittalsItemSpecs };
