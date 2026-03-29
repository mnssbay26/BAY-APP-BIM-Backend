const {
  fetchAllPaginatedResults,
} = require("../../../../utils/general/pagination.utils");

async function getCategoryAttributes(token, projectId, categoryId) {
  if (!token) throw new Error('Unauthorized: No token provided');
  if (!projectId) throw new Error('Project ID is required');
  if (!categoryId) throw new Error('Category ID is required');

  return fetchAllPaginatedResults(
    `${process.env.AUTODESK_BASE_URL}/construction/assets/v1/projects/${projectId}/categories/${categoryId}/custom-attributes`,
    token
  );
}

module.exports = { getCategoryAttributes };
