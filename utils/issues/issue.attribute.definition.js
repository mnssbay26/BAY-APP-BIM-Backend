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
  const url = `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issue-attribute-definitions`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });

    //console.log ('Issue Attribute Definitions:', data.results[0]);
    return data;
  } catch (error) {
    console.error(
      "Error fetching Issue Attributes definition:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const GetIssueBim360AttributeDefinitions = async (projectId, token) => {
  const url = `https://developer.api.autodesk.com/issues/v2/containers/${projectId}/issue-attribute-definitions`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });

    //console.log ('Issue Attribute Definitions:', data.results[0]);
    return data;
  } catch (error) {
    console.error(
      "Error fetching Issue Attributes definition:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = { GetIssueAttributeDefinitions, GetIssueBim360AttributeDefinitions };
