
const { defaul: axios } = require("axios");

const {
  getSubmittalsItems,
} = require("../../libs/acc/submittals/get.submittals.items");
const {
  mapUserIdsToNames,
} = require("../../../utils/account_admin/user.mapper.utils");

const stateMap = {
  "sbc-1": "Waiting for submission",
  rev: "In review",
  "mgr-2": "Reviewed",
  "mgr-1": "Submitted",
  "sbc-2": "Closed",
};

const userFields = [
  "manager",
  "createdBy",
  "updatedBy",
  "submittedBy",
  "publishedBy",
  "sentToReviewBy",
];

const {
  saveDataItem,
  deleteDataItem,
  queryDataService,
} = require("../../../services/dynamo/dynamo.service");

const {
  mapSubmittalToItem,
} = require("../../../services/schemas/submittals.schema");

const GetProjectSubmittals = async (req, res) => {
  const token = req.cookies["access_token"];
  const accountId = req.params.accountId;
  let projectId = req.params.projectId;

  if (projectId.startsWith("b.")) {
    projectId = projectId.substring(2);
  }

  if (!token) {
    return res
      .status(401)
      .json({ data: null, error: "Unauthorized", message: "No token" });
  }

  try {
    const projectsubmittals = await getSubmittalsItems(token, projectId);

    if (!Array.isArray(projectsubmittals) || projectsubmittals.length === 0) {
      return res.status(200).json({
        data: { submittals: [] },
        error: null,
        message: "No Issues found for this project",
      });
    }

    const userMap = await mapUserIdsToNames(
      projectsubmittals,
      projectId,
      token,
      userFields
    );

    const submittalsWithUserDetails = await Promise.all(
      projectsubmittals.map(async (submittal) => {
        submittal.projectId = projectId;
        submittal.stateId = stateMap[submittal.stateId] || submittal.stateId;
        submittal.managerName =
          userMap[submittal.manager] || "No Manager Assigned";
        submittal.manager = userMap[submittal.manager] || "No Manager Assigned";
        submittal.subcontractorName =
          userMap[submittal.subcontractor] || "No Subcontractor Assigned";
        submittal.createdByName =
          userMap[submittal.createdBy] || "No Creator Assigned";
        submittal.respondedByName =
          userMap[submittal.respondedBy] || "No Responder Assigned";
        submittal.updatedByName =
          userMap[submittal.updatedBy] || "No Updater Assigned";
        submittal.submittedByName =
          userMap[submittal.submittedBy] || "No Submitter Assigned";
        submittal.publishedByName =
          userMap[submittal.publishedBy] || "No Publisher Assigned";
        submittal.sentToReviewByName =
          userMap[submittal.sentToReviewBy] || "No Reviewer Assigned";

        if (submittal.specId) {
          try {
            submittal.specDetails = await GetSubmittalSpecId(
              projectId,
              submittal.specId,
              token
            );
          } catch {
            submittal.specDetails = null;
          }
        } else {
          submittal.specDetails = "No Spec Assigned";
        }

        return submittal;
      })
    );

    //console.log("Submittals", submittalsWithUserDetails);

    const existingItems = await queryDataService(
      accountId,
      projectId,
      "submittals"
    );
    const idsExisting = existingItems.map((item) => item.id);

    const newIds = submittalsWithUserDetails.map((submittal) => submittal.id);

    const idsToDelete = idsExisting.filter((id) => !newIds.includes(id));
    await Promise.all(
      idsToDelete.map((id) =>
        deleteDataItem(`${accountId}#${projectId}`, `submittals#${id}`)
      )
    );

    await Promise.all(
      submittalsWithUserDetails.map((submittal) => {
        const item = mapSubmittalToItem(submittal, accountId, projectId);
        return saveDataItem(item);
      })
    );

    res.status(200).json({
      data: {
        submittals: submittalsWithUserDetails,
      },
      error: null,
      message: "Submittals fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching submittals:", err.message);
    if (err.response) {
      console.error("Autodesk response:", err.response.data);
    }
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to retrieve submittals",
    });
  }
};

module.exports = { GetProjectSubmittals };
