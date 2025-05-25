const  express = require ("express")
const router = express.Router()

const { GetThreeLeggedAuth, GetTokenAuth} = require ("./auth.controller.js")

router.get("/three-legged", GetThreeLeggedAuth)
router.get("/token",GetTokenAuth )

module.exports = router
