const express = require("express");
const {
  GetProjects,
} = require("./account_admin/acc.account.projects.controller");

/**
 * Router for ACC project endpoints
 * @type {import('express').Router}
 */
const router = express.Router();

/**
 * @route GET /acc/projects
 * @summary Retrieve ACC projects for authorized hubs
 * @returns {Array} 200 - List of ACC projects
 * @returns {Error}  401 - Unauthorized
 * @returns {Error}  404 - No authorized hubs found
 * @returns {Error}  500 - Internal server error
 */
router.get("/projects", GetProjects);

module.exports = router;
