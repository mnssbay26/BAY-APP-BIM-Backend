const express = require("express");

const { PostModelData } = require("../controllers/model_data/model.data.controller");
const { GetModelData } = require("../controllers/model_data/model.data.controller");
const { PatchModelData } = require("../controllers/model_data/model.data.controller");
const { DeleteModelData } = require("../controllers/model_data/model.data.controller");

const router = express.Router();

router.post("/:accountId/:projectId/data", PostModelData);
router.get("/:accountId/:projectId/data", GetModelData);
router.patch("/:accountId/:projectId/data/:dbId", PatchModelData);
router.delete("/:accountId/:projectId/data/:dbId", DeleteModelData);

module.exports = router;