const axios = require("axios");

async function getAsset(token, projectId, assetId) {
  if (!token)    throw new Error("Unauthorized: No token provided");
  if (!projectId) throw new Error("Project ID is required");
  if (!assetId)   throw new Error("Asset ID is required");

  const { data } = await axios.get(
    `${process.env.AUTODESK_BASE_URL}/construction/assets/v1/projects/${projectId}/assets/${assetId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return data;
}

module.exports = { getAsset };
