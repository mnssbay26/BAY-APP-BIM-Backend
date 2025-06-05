const { defaul: axios } = require("axios");

const {
  mapUserIdsToNames,
} = require("../../../utils/account_admin/user.mapper.utils");
const {
  fetchAllPaginatedResults,
} = require("../../../utils/general/pagination.utils");

const userFields = [
  "createdBy",
  "assignedTo",
  "closedBy",
  "openedBy",
  "updatedBy",
];

const GetRfis = async (req, res) => {
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
  
  //console.log("token:", token);
  //console.log("accountId:", accountId);
  //console.log("projectId:", projectId);

  try {
    const rfis = await fetchAllPaginatedResults(
      `https://developer.api.autodesk.com/bim360/rfis/v2/containers/${projectId}/rfis`,
      token
    );

    if (!Array.isArray(rfis) || rfis.length === 0) {
      return res.status(200).json({
        data: { rfis: [] },
        error: null,
        message: "No RFIs found for this project",
      });
    }

    // Map user IDs to names for relevant fields
    const userMap = await mapUserIdsToNames(rfis, userFields, token);

    const rfisdatawithnames = rfis.map((rfi) => {
      const disciplineName =
        Array.isArray(rfi.discipline) && rfi.discipline.length > 0
          ? rfi.discipline.join(", ")
          : "Not specified";

      return {
        ...rfi,
        createdBy: userMap[rfi.createdBy] || "Unknown User",
        assignedTo: userMap[rfi.assignedTo] || "Unknown User",
        managerId: userMap[rfi.managerId] || "Unknown User",
        respondedBy: userMap[rfi.respondedBy] || "Unknown User",
        reviewerId: userMap[rfi.reviewerId] || "Unknown User",
        updatedBy: userMap[rfi.updatedBy] || "Unknown User",
        closedBy: userMap[rfi.closedBy] || "Unknown User",
        discipline: disciplineName,
      };
    });

    //console.log("RFIS", rfisdatawithnames);

    return res.status(200).json({
      data: { 
        rfis: rfisdatawithnames
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

module.exports = { GetRfis };
