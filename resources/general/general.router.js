const express = require("express");
const { GetUserProfile } = require("./general.user.profile");

/**
 * Router for user profile endpoint.
 * @type {import('express').Router}
 */
const router = express.Router();

/**
 * GET /user/profile
 * @summary Retrieve user profile information
 * @tags User
 * @security cookieAuth
 * @returns {object} 200 - User profile data
 * @returns {Error}  401 - Unauthorized (missing or invalid token)
 * @returns {Error}  404 - No user profile found
 * @returns {Error}  500 - Internal server error
 */
router.get("/user/profile", GetUserProfile);

module.exports = router;
