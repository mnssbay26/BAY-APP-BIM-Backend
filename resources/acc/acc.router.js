const express = require("express");

const { GetProjects } = require("./account_admin/acc.account.projects.controller");
const { GetProject } = require("./account_admin/acc.project.controller");
const { GetProjectUsers} = require("./account_admin/acc.project.users.controller");
const { GetIssues } = require("./issues/acc.issues.controller");
const { GetRfis } = require("./rfis/acc.rfis.controller");
const { GetSubmittals } = require("./submittals/acc.submittals.controller");
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
router.get("/projects/:accountId/:projectId", GetProject);
router.get("/projects/:accountId/:projectId/users", GetProjectUsers);
router.get("/projects/:accountId/:projectId/issues", GetIssues);
router.get("/projects/:accountId/:projectId/rfis", GetRfis);
router.get("/projects/:accountId/:projectId/submittals", GetSubmittals);

module.exports = router;
