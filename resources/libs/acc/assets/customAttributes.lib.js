const axios = require("axios");

async function getCustomAttributes(token, projectId) {
  if (!token) throw new Error('Unauthorized: No token provided');
  if (!projectId) throw new Error('Project ID is required');

  const { data } = await axios.get(
    `${process.env.AUTODESK_BASE_URL}/construction/assets/v1/projects/${projectId}/custom-attributes`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return Array.isArray(data) ? data : (data.results || []);
}

module.exports = { getCustomAttributes };
