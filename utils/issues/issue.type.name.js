const express = require("express");
const axios = require("axios");
const router = express.Router();
const { format } = require("morgan");

const GetIssuesTypeName = async (projectId, token) => {
  const url = `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issue-types`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });

    return data;
  } catch (error) {
    console.error(
      "Error fetching issue attribute mappings:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const GetIssuesBim360TypeName = async (projectId, token) => {
  const url = `https://developer.api.autodesk.com/issues/v2/containers/${projectId}/issue-types`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });

    return data;
  } catch (error) {
    console.error(
      "Error fetching issue attribute mappings:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = { GetIssuesTypeName, GetIssuesBim360TypeName };
