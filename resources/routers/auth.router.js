const express = require("express");

const {GetThreeLeggedAuth, GetTokenAuth, PostLogout} = require ("../controllers/auth/auth.controller")
/**
 * Router for Autodesk authentication endpoints.
 * @type {import('express').Router}
 */
const router = express.Router();

/**
 * OAuth callback for Autodesk Three-Legged Authentication.
 * Exchanges the authorization code for a token and sets a secure cookie.
 *
 * @route GET /auth/three-legged
 * @returns {Redirect} 302 - Redirects to the frontend platform page
 */
router.get("/three-legged", GetThreeLeggedAuth);

/**
 * Provides a two-legged token for server-to-server interactions.
 *
 * @route GET /auth/token
 * @returns {object} 200 - JSON containing the access_token
 * @returns {object} 500 - JSON with error message on failure
 */
router.get("/token", GetTokenAuth);

router.post("/logout", PostLogout);

module.exports = router;
