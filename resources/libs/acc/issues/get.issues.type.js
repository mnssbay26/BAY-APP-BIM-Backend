const {
  fetchCompletePaginatedResponse,
} = require("../../../../utils/general/pagination.utils");

async function getProjectIssuesTypes (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    return fetchCompletePaginatedResponse(
      `${process.env.AUTODESK_BASE_URL}/construction/issues/v1/projects/${projectId}/issue-types`,
      token
    );
}
module.exports = { getProjectIssuesTypes };
