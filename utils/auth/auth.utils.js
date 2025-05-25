const express = require("express");
const axios = require("axios");

const router = express.Router();

const APS_CLIENT_ID = process.env.APS_CLIENT_ID;
const APS_CLIENT_SECRET = process.env.APS_CLIENT_SECRET;

const APS_AUTH_URL = process.env.APS_AUTH_URL;

const GetAPSThreeLeggedToken = async (code) => {
  if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
    throw new Error("Missing APS CLIENT ID and/or APS CLIENT SECRET");
  }

  const credentials = `${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");

  const requestData = {
    grant_type: "authorization_code",
    code: code,
    redirect_uri: APS_AUTH_URL,
    scope: "data:read data:write data:create account:read ",
  };

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    Authorization: `Basic ${encodedCredentials}`,
  };

  try {
    const { data } = await axios.post(
      "https://developer.api.autodesk.com/authentication/v2/token",
     new URLSearchParams(requestData).toString(),
      { headers }
    );

    return data.access_token;
  } catch (error) {
    console.error("Error fetching token:", error.message);
    if (error.response) {
      console.error("Error response data:", error.response.data);
    }
    throw error;
  }
};

const  GetAPSToken = async() => {
    if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
    throw new Error("Missing APS CLIENT ID and/or APS CLIENT SECRET");
  }

  const credentials = `${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    Authorization: `Basic ${encodedCredentials}`,
  };

  const requestdata = {
    grant_type: "client_credentials",
    scope: "data:read data:write bucket:create bucket:read bucket:delete",
  };

  try {
    const {data} = await axios.post ('https://developer.api.autodesk.com/authentication/v2/token',
        new URLSearchParams(requestdata).toString(),
        { headers }
    )

    return data.access_token;
  } catch (error) {
    console.error("Error fetching token:", error.message);
    if (error.response) {
      console.error("Error response data:", error.response.data);
    }
    throw error;
  }
};

module.exports = {
    GetAPSThreeLeggedToken,
    GetAPSToken,

}