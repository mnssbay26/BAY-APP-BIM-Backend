const express = require("express");
const axios = require("axios");
const router = express.Router();

const GetUserbyuserId = async (userId, projectId, token) => {
  const url = `https://developer.api.autodesk.com/construction/admin/v1/projects/${projectId}/users/${userId}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });
    if (!data || !data.data) {
      throw new Error("User not found or no data available");
    }
    return data;
  } catch (error) {
    console.error("Error fetching user by userId:", error.message);
    if (error.response) {
      console.error("Autodesk response:", error.response.data);
    }
    throw new Error("Failed to retrieve user by userId");
  }
};

module.exports = { GetUserbyuserId };
