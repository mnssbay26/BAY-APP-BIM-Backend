const { GetAPSThreeLeggedToken, GetAPSToken } = require('../../utils/auth/auth.utils');

/**
 * Base URL for frontend redirect after authentication.
 * @constant {string}
 */
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * OAuth callback for Autodesk Three-Legged Authentication.
 * Exchanges authorization code for access token and sets HTTP-only cookie.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const GetThreeLeggedAuth = async (req, res) => {
  const { code } = req.query;

  try {
    const token = await GetAPSThreeLeggedToken(code);

    res.cookie('access_token', token, {
      //domain: '.156041440121.cloud.bayer.com',
      maxAge: 360_000_000, // ~100 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      path: '/',
    });

    console.debug('Three-legged token acquired');
    return res.redirect(`${FRONTEND_URL}/platform`);
  } catch (err) {
    console.error('Error fetching three-legged token:', err);
    return res.redirect(`${FRONTEND_URL}/platform`);
  }
};

/**
 * Provides a two-legged token for server-to-server interactions.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const GetTokenAuth = async (req, res) => {
  try {
    const token = await GetAPSToken();
    return res.status(200).json({
      data: { access_token: token },
      error: null,
      message: 'Two-legged token generated successfully',
    });
  } catch (err) {
    console.error('Error generating two-legged token:', err);
    return res.status(500).json({
      data: null,
      error: err.message,
      message: 'Failed to generate token',
    });
  }
};

module.exports = { GetThreeLeggedAuth, GetTokenAuth };