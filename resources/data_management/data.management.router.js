const express = require("express");

const { GetFederatedModel } = require("./data.fed.model.cotroller");
const { GetFolderStructure} = require("./data.folders.str.controller");
const { GetFolderPermits } = require("./data.management.folder.permits");

const router = express.Router();

router.get("/:accountId/:projectId/federated-model", GetFederatedModel);
router.get("/:accountId/:projectId/folder-structure", GetFolderStructure);
router.get("/:accountId/:projectId/folders-permissions", GetFolderPermits);

module.exports = router;