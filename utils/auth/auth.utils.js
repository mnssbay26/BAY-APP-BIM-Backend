const axios = require("axios");

/**
 * Autodesk Platform Services (APS) OAuth utilities.
 * Provides methods to retrieve two-legged and three-legged access tokens.
 * @module utils/auth/auth.utils
 */

const { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_AUTH_URL } = process.env;

/**
 * Exchanges an authorization code for a Three-Legged OAuth token.
 * @async
 * @param {string} code - Authorization code returned by Autodesk OAuth.
 * @returns {Promise<string>} Resolves with the access token.
 * @throws {Error} Throws if credentials are missing or request fails.
 */
const GetAPSThreeLeggedToken = async (code) => {
  if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
    throw new Error(
      "Missing APS_CLIENT_ID or APS_CLIENT_SECRET environment variables"
    );
  }

  const credentials = `${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");

  const requestData = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: APS_AUTH_URL,
    scope: "data:read data:write data:create account:read",
  }).toString();

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    Authorization: `Basic ${encodedCredentials}`,
  };

  try {
    const response = await axios.post(
      "https://developer.api.autodesk.com/authentication/v2/token",
      requestData,
      { headers }
    );
    return response.data.access_token;
  } catch (err) {
    console.error("Error fetching three-legged token:", err.message);
    if (err.response) console.error("Response data:", err.response.data);
    throw err;
  }
};

/**
 * Retrieves a Two-Legged (client credentials) OAuth token.
 * @async
 * @returns {Promise<string>} Resolves with the access token.
 * @throws {Error} Throws if credentials are missing or request fails.
 */
const GetAPSToken = async () => {
  if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
    throw new Error(
      "Missing APS_CLIENT_ID or APS_CLIENT_SECRET environment variables"
    );
  }

  const credentials = `${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");

  const requestData = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "data:read data:write bucket:create bucket:read bucket:delete account:read",
  }).toString();

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    Authorization: `Basic ${encodedCredentials}`,
  };

  try {
    const response = await axios.post(
      "https://developer.api.autodesk.com/authentication/v2/token",
      requestData,
      { headers }
    );
    return response.data.access_token;
  } catch (err) {
    console.error("Error fetching two-legged token:", err.message);
    if (err.response) console.error("Response data:", err.response.data);
    throw err;
  }
};

module.exports = {
  GetAPSThreeLeggedToken,
  GetAPSToken,
};
