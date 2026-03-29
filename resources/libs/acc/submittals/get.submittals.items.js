const {
  fetchAllPaginatedResults,
} = require("../../../../utils/general/pagination.utils");

async function getSubmittalsItems (token, projectId,) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');

    return fetchAllPaginatedResults(
      `${process.env.AUTODESK_BASE_URL}/construction/submittals/v2/projects/${projectId}/items`,
      token
    );
}
module.exports = { getSubmittalsItems };
