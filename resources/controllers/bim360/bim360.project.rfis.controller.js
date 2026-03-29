const { getBim360ProjectRfis } = require("../../libs/bim360/rfis/get.rfis");

const {
  mapUserIdsToNames,
} = require("../../../utils/account_admin/user.mapper.utils");

const userFields = [
  "createdBy",
  "assignedTo",
  "closedBy",
  "openedBy",
  "updatedBy",
  "managerId",
  "reviewers",
  "respondedBy",
];

const {
  saveDataItem,
  deleteDataItem,
  queryDataService,
} = require("../../../services/dynamo/dynamo.service");
const { mapRfiToItem } = require("../../../services/schemas/rfis.shema");

const GetProjectRfis = async (req, res) => {
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
    const projectRfis = await getBim360ProjectRfis(token, projectId);
    if (!Array.isArray(projectRfis) || projectRfis.length === 0) {
      return res.status(200).json({
        data: { rfis: [] },
        error: null,
        message: "No RFIs found for this project",
      });
    }

    // Map user IDs to names for relevant fields
    const userMap = await mapUserIdsToNames(projectRfis, projectId, token, userFields);

    const rfisdatawithnames = projectRfis.map((rfi) => {
      const disciplineName =
        Array.isArray(rfi.discipline) && rfi.discipline.length > 0
          ? rfi.discipline.join(", ")
          : "Not specified";

      return {
        ...rfi,
        createdBy: userMap[rfi.createdBy] || "Unknown User",
        assignedTo: Array.isArray(rfi.assignedTo)
          ? rfi.assignedTo.map((a) => userMap[a.id || a] || "Unknown User").join(", ")
          : userMap[rfi.assignedTo] || "Unknown User",
        managerId: userMap[rfi.managerId] || "Unknown User",
        respondedBy: userMap[rfi.respondedBy] || "Unknown User",
        reviewers: Array.isArray(rfi.reviewers)
          ? rfi.reviewers.map((r) => userMap[r.id || r] || "Unknown User").join(", ")
          : "No Reviewers",
        updatedBy: userMap[rfi.updatedBy] || "Unknown User",
        closedBy: userMap[rfi.closedBy] || "Unknown User",
        discipline: disciplineName,
      };
    });

    console.log("RFIS", rfisdatawithnames);

    const existingItems = await queryDataService(accountId, projectId, "rfis");
    const idsExisting = existingItems.map((item) => item.rfiId);

    const newIds = rfisdatawithnames.map((rfi) => rfi.id);

    const idsToDelete = idsExisting.filter((id) => !newIds.includes(id));
    await Promise.all(
      idsToDelete.map((id) =>
        deleteDataItem(`${accountId}#${projectId}`, `rfis#${id}`)
      )
    );

    await Promise.all(
      rfisdatawithnames.map((rfi) => {
        const item = mapRfiToItem(rfi, accountId, projectId);
        return saveDataItem(item);
      })
    );

    return res.status(200).json({
      data: {
        rfis: rfisdatawithnames,
      },
      error: null,
      message: "RFIs retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching RFIs:", err.message);
    if (err.response) {
      console.error("Autodesk response:", err.response.data);
    }
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to retrieve RFIs",
    });
  }
};

module.exports = {
  GetProjectRfis,
};