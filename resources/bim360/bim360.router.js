const express = require('express');
const { GetProjects } = require('./account_admin/bim360.account.projects.controller');

/**
 * Router for BIM360 project endpoints
 * @type {import('express').Router}
 */
const router = express.Router();

/**
 * @route GET /bim360/projects
 * @summary Retrieve BIM360 projects for authorized hubs
 * @returns {Array} 200 - List of BIM360 projects
 * @returns {Error}  401 - Unauthorized (missing or invalid token)
 * @returns {Error}  404 - No authorized hubs found
 * @returns {Error}  500 - Internal server error
 */
router.get('/projects', GetProjects);

module.exports = router;