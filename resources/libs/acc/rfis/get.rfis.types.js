const {
  fetchCompletePaginatedResponse,
} = require("../../../../utils/general/pagination.utils");

async function getRfisTypes (token, projectId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');  
    
    return fetchCompletePaginatedResponse(
      `${process.env.AUTODESK_BASE_URL}/construction/v1/projects/${projectId}/rfi-types`,
      token
    );
}
module.exports = { getRfisTypes };
