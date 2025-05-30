const express = require("express");
const axios = require("axios");
const router = express.Router();
const { format } = require("morgan");

/*
     GetIssueAttributeDefinition retrieves issue attribute definitions for a project.
     @param {string} projectId - The ID of the project to retrieve issue attribute definitions for.
     @param {string} token - The access token for authentication.
     @return {Promise<Object>} - A promise that resolves to the issue attribute definitions data.
     @throws {Error} - Throws an error if the request fails or if no data is found.
*/

const GetIssueAttributeDefinitions = async (projectId, token) => {
  const url =
    `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issue-attribute-definitions` ||
    `https://developer.api.autodesk.com/issues/v2/containers/${projectId}/issue-attribute-definitions`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });
    if (!data || !data.data) {
      throw new Error(
        "Issue attribute definitions not found or no data available"
      );
    }
    return data;
  } catch (error) {
    console.error("Error fetching issue attribute definitions:", error.message);
    if (error.response) {
      console.error("Autodesk response:", error.response.data);
    }
    throw new Error("Failed to retrieve issue attribute definitions");
  }
};

module.exports = { GetIssueAttributeDefinitions };
