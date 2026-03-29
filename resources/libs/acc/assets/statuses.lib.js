const {
  fetchAllPaginatedResults,
} = require("../../../../utils/general/pagination.utils");

async function getStatuses(token, projectId) {
  if (!token) throw new Error('Unauthorized: No token provided');
  if (!projectId) throw new Error('Project ID is required');

  return fetchAllPaginatedResults(
    `${process.env.AUTODESK_BASE_URL}/construction/assets/v1/projects/${projectId}/asset-statuses`,
    token
  );
}

module.exports = { getStatuses };
