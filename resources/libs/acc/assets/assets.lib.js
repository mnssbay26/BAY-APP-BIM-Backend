const {
  fetchAllPaginatedResults,
} = require("../../../../utils/general/pagination.utils");

async function getAssets(token, projectId, queryParams = {}) {
  if (!token) throw new Error('Unauthorized: No token provided');
  if (!projectId) throw new Error('Project ID is required');

  const url = new URL(
    `${process.env.AUTODESK_BASE_URL}/construction/assets/v2/projects/${projectId}/assets`
  );

  if (queryParams.limit) {
    url.searchParams.set("limit", String(queryParams.limit));
  } else {
    url.searchParams.set("limit", "200");
  }

  if (queryParams.cursorState) {
    url.searchParams.set("cursorState", String(queryParams.cursorState));
  }

  if (queryParams.filterIsActive !== undefined) {
    url.searchParams.set("filter[isActive]", String(queryParams.filterIsActive));
  }

  if (queryParams.filterCategoryId) {
    url.searchParams.set("filter[categoryId]", String(queryParams.filterCategoryId));
  }

  if (queryParams.filterStatusId) {
    url.searchParams.set("filter[statusId]", String(queryParams.filterStatusId));
  }

  if (queryParams.filterLocationId) {
    url.searchParams.set("filter[locationId]", String(queryParams.filterLocationId));
  }

  return fetchAllPaginatedResults(url.toString(), token, {
    cursorParam: "cursorState",
  });
}

module.exports = { getAssets };
