const axios = require("axios");

async function getCategories(token, projectId) {
  if (!token) throw new Error('Unauthorized: No token provided');
  if (!projectId) throw new Error('Project ID is required');

  const { data } = await axios.get(
    `${process.env.AUTODESK_BASE_URL}/construction/assets/v1/projects/${projectId}/categories`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return Array.isArray(data) ? data : (data.results || []);
}

module.exports = { getCategories };
