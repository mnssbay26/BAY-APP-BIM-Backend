const axios = require ("axios")

const {GetAPSToken} = require ("../../../utils/auth/auth.utils")

async function getTwoLeggedAuth () {
     try {
    const token = await GetAPSToken();
    return { token };
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