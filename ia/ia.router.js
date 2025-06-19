const  express = require ("express");

const { PostAiIssues } = require("../ia/controllers/ia.issues.controller");
const { PostAiRfis } = require("../ia/controllers/ai.rfis.controller");
const { PostAiSubmittals } = require("../ia/controllers/ai.submittals.controller");
const { PostAiUsers } = require("../ia/controllers/ai.users.controller");

const router = express.Router();

router.post ("/issues", PostAiIssues);
router.post ("/rfis", PostAiRfis);
router.post ("/submittals", PostAiSubmittals);
router.post ("/users", PostAiUsers);

module.exports = router;