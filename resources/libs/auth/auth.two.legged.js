const axios = require ("axios")

const {GetAPSToken} = require ("../../../utils/auth/auth.utils")

async function getTwoLeggedAuth () {
     try {
    const token = await GetAPSToken();
    return res.status(200).json({
      data: { access_token: token },
      error: null,
      message: "Two-legged token generated successfully",
    });
  } catch (err) {
    console.error("Error generating two-legged token:", err);
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to generate token",
    });
  }
};

module.exports = { getTwoLeggedAuth };