const express = require("express");
const axios = require("axios");
const router = express.Router();
const { format } = require("morgan");

const GetIssuesTypeName = async (projectId, token) => {
  const url =
    `https://developer.api.autodesk.com/data/v1/projects/${projectId}/issues/types` ||
    `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issue-types`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });
    if (!data || !data.data) {
      throw new Error("Issue types not found or no data available");
    }
    return data;
  } catch (error) {
    console.error("Error fetching issue types:", error.message);
    if (error.response) {
      console.error("Autodesk response:", error.response.data);
    }
    throw new Error("Failed to retrieve issue types");
  }
};

module.exports = { GetIssuesTypeName };
