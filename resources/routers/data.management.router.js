const express = require("express");

const { GetFederatedModel } = require("../controllers/datamanagement/data.fed.model.cotroller");
const { GetFolderStructure} = require("../controllers/datamanagement/data.folders.str.controller");
const { GetFolderPermits } = require("../controllers/datamanagement/data.management.folder.permits");

const router = express.Router();

router.get("/:accountId/:projectId/federated-model", GetFederatedModel);
router.get("/:accountId/:projectId/folder-structure", GetFolderStructure);
router.get("/:accountId/:projectId/folders-permissions", GetFolderPermits);

module.exports = router;