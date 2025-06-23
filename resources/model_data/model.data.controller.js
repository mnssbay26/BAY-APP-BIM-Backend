const express = require("express");

const {
  saveModelItem,
  deleteModelItem,
  queryModelService,
   updateModelItem,
  PK_ATTR,
  MODEL_SK_ATTR,
} = require("../../services/dynamo/dynamo.service");

const  {sanitize} = require("../../utils/general/sanitaze.db");

const PostModelData = async (req, res) => {
  const { accountId, projectId } = req.params;
  const { service, modelUrn, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items provided" });
  }

  try {
    const sanitizedItems = items.map(item => {
      const out = {};
      Object.entries(item).forEach(([key, value]) => {
        // no sanitizamos campos numéricos: los dejamos como vienen
        if (typeof value === "string" && isNaN(Number(value))) {
          out[key] = sanitize(value);
        } else {
          out[key] = value;
        }
      });
      return out;
    });

    await Promise.all(
      sanitizedItems.map(item => {
        const pk = `${accountId}#${projectId}`;
        const sk = `${service}#${modelUrn}#${item.dbId}`;
        return saveModelItem({
          [PK_ATTR]: pk,
          [MODEL_SK_ATTR]: sk,
          ...item,
        });
      })
    );

    res.json({ message: "Model data saved (and sanitized)." });
  } catch (err) {
    console.error("Error creating model data:", err);
    res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to create model data",
    });
  }
};

const GetModelData = async (req, res) => {
  const { accountId, projectId } = req.params;
  const service         = "model_data";
  const modelUrn        = req.query.modelUrn;
  const disciplineFilter= req.query.discipline;

  if (!modelUrn) {
    return res.status(400).json({ error: "modelUrn query param is required" });
  }

  try {
    let items = await queryModelService(accountId, projectId, service, modelUrn);

    if (disciplineFilter) {
      items = items.filter(i => i.Discipline === disciplineFilter);
    }

    res.json({ data: items });
    //console.log("data", items);
  } catch (err) {
    console.error("Error fetching model data:", err);
    res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to fetch model data",
    });
  }
};

const DeleteModelData = async (req, res) => {
  const { accountId, projectId, dbId } = req.params;
  const { service, modelUrn } = req.body;

  if (!service || !modelUrn) {
    return res.status(400).json({ error: "service and modelUrn are required in body" });
  }

  try {
    await deleteModelItem(accountId, projectId, service, modelUrn, dbId);
    res.json({ message: "Model data deleted." });
  } catch (err) {
    console.error("Error deleting model data:", err);
    res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to delete model data",
    });
  }
};

const PatchModelData = async (req, res) => {
  const { accountId, projectId, dbId } = req.params;
  const { service, modelUrn, updates } = req.body;

  if (!service || !modelUrn || typeof updates !== "object") {
    return res.status(400).json({ error: "service, modelUrn and updates are required" });
  }

  try {
    await updateModelItem(accountId, projectId, service, modelUrn, dbId, updates);
    res.json({ message: "Model data updated." });
  } catch (err) {
    console.error("Error updating model data:", err);
    res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to update model data",
    });
  }
};

module.exports = {
  PostModelData,
  GetModelData,
  DeleteModelData,
  PatchModelData
};
