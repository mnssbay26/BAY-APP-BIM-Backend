const express = require("express");

const { GetBim360Projects } = require ("../controllers/bim360/bim360.projects.controller.js")
const { GetProject } = require ("../controllers/bim360/bim360.project.controller.js");
const { GetProjectUsers } = require ("../controllers/bim360/bim360.project.users.controller.js");
const { GetProjectIssues } = require ("../controllers/bim360/bim360.project.issues.controller.js");
const { GetProjectRfis } = require ("../controllers/bim360/bim360.project.rfis.controller.js");

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
router.get("/projects", GetBim360Projects);
router.get("/projects/:accountId/:projectId", GetProject);
router.get("/projects/:accountId/:projectId/users", GetProjectUsers);
router.get("/projects/:accountId/:projectId/issues", GetProjectIssues);
router.get("/projects/:accountId/:projectId/rfis", GetProjectRfis);

module.exports = router;
