const {
  fetchAllPaginatedResults,
} = require("../../../../utils/general/pagination.utils");

async function getProjectIssues (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    return fetchAllPaginatedResults(
      `${process.env.AUTODESK_BASE_URL}/construction/issues/v1/projects/${projectId}/issues?limit=20&offset=0`,
      token
    );
}
module.exports = { getProjectIssues };
