const express = require ("express")

const { GetProjects} = require ("./account_admin/bim360.account.projects.controller")

const router = express.Router()

router.get ('/projects', GetProjects)

module.exports = router