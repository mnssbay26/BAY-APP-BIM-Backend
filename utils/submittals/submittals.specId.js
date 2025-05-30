const express = require("express");
const axios = require("axios");
const router = express.Router();
const { format } = require("morgan");

const GetSubmittalsSpecId = async (projectId, specId, token) => {
  const url = `https://developer.api.autodesk.com/construction/submittals/v2/projects/${projectId}/specs/${specId}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });
    if (!data || !data.data) {
      throw new Error("Spec not found or no data available");
    }
    return data;
  } catch (error) {
    console.error("Error fetching submittals spec by ID:", error.message);
    if (error.response) {
      console.error("Autodesk response:", error.response.data);
    }
    throw new Error("Failed to retrieve submittals spec by ID");
  }
};

module.exports = { GetSubmittalsSpecId };
