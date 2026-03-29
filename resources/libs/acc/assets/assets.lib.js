const axios = require("axios");

async function getAssets(token, projectId, queryParams = {}) {
  if (!token) throw new Error('Unauthorized: No token provided');
  if (!projectId) throw new Error('Project ID is required');

  const params = {};
  if (queryParams.limit)                          params.limit = queryParams.limit;
  if (queryParams.cursorState)                    params.cursorState = queryParams.cursorState;
  if (queryParams.filterIsActive !== undefined)   params['filter[isActive]'] = queryParams.filterIsActive;
  if (queryParams.filterCategoryId)               params['filter[categoryId]'] = queryParams.filterCategoryId;
  if (queryParams.filterStatusId)                 params['filter[statusId]'] = queryParams.filterStatusId;
  if (queryParams.filterLocationId)               params['filter[locationId]'] = queryParams.filterLocationId;

  const { data } = await axios.get(
    `${process.env.AUTODESK_BASE_URL}/construction/assets/v2/projects/${projectId}/assets`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params,
    }
  );

  return data;
}

module.exports = { getAssets };
