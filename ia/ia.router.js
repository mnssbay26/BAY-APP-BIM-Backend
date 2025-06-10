const  express = require ("express");

const { PostAiIssues } = require("./ai/ia.issues.controller");
const { PostAiRfis } = require("./ai/ia.rfis.controller");
const { PostAiSubmittals } = require("./ai/ia.submittals.controller");
const { PostAiUsers } = require("./ai/ia.users.controller");

router.post ("/issues", PostAiIssues);
router.post ("/rfis", PostAiRfis);
router.post ("/submittals", PostAiSubmittals);
router.post ("/users", PostAiUsers);

module.exports = router;