const express = require("express");

const { GetFederatedModel } = require("./data.fed.model.cotroller");
const { GetFodlerStructure } = require("./data.folders.str.controller");

const router = express.Router();

router.get("/:accountId/:projectId/federated-model", GetFederatedModel);
router.get("/:accountId/:projectId/folder-structure", GetFodlerStructure);

module.exports = router;