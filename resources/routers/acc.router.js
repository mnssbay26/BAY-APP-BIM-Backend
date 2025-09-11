const express = require("express");

const { GetAccProjects } = require ("../controllers/acc/acc.projects.controller.js")
const { GetProject } = require ("../controllers/acc/acc.project.controller.js")
const { GetProjectIssues} = require ("../controllers/acc/acc.project.issues.controller.js")
const { GetProjectUsers } = require ("../controllers/acc/acc.project.users.controller.js")
const { GetProjectRfis } = require ("../controllers/acc/acc.project.rfis.controller.js")
const { GetProjectSubmittals } = require ("../controllers/acc/acc.project.submittals.controller.js")

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
router.get("/projects", GetAccProjects);
router.get("/projects/:accountId/:projectId", GetProject);
router.get("/projects/:accountId/:projectId/users", GetProjectUsers);

router.get("/projects/:accountId/:projectId/issues", GetProjectIssues);
router.get("/projects/:accountId/:projectId/rfis", GetProjectRfis);
router.get("/projects/:accountId/:projectId/submittals", GetProjectSubmittals);

module.exports = router;
