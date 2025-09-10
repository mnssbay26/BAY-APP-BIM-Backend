const axios = require ("axios")

const {
  getProjectIssues,
} = require("../../libs/acc/issues/get.project.issues");
const {
  getProjectIssuesTypes,
} = require("../../libs/acc/issues/get.issues.type");

const { 
    getBim360ProjectIssuesAttributeDefinitions 
} = require("../../libs/bim360/issues/get.attribute.definitions");

const {
  mapUserIdsToNames,
} = require("../../../utils/account_admin/user.mapper.utils");

const {
  buildCustomAttributeValueMap,
  enrichCustomAttributes,
} = require("./../../../utils/issues/issues.attribute.mapper");

const userFields = [
  "createdBy",
  "assignedTo",
  "closedBy",
  "openedBy",
  "updatedBy",
  "ownerId",
];

const {
  saveDataItem,
  deleteDataItem,
  queryDataService,
} = require("../../../services/dynamo/dynamo.service");
const { mapIssueToItem } = require("../../../services/schemas/issues.schema");


const GetIssues = async (req, res) => {
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
    const projectIssues = await getProjectIssues(token, projectId);

    if (!Array.isArray(projectIssues) || projectIssues.length === 0) {
      return res.status(200).json({
        data: { issues: [] },
        error: null,
        message: "No Issues found for this project",
      });
    }

    const issuesTypeNameData = await getProjectIssuesTypes(projectId, token);

    const issueTypeMap = issuesTypeNameData.results.reduce((acc, type) => {
      acc[type.id] = type.title;
      return acc;
    }, {});

    const userMap = await mapUserIdsToNames(
      issues,
      projectId,
      token,
      userFields
    );

    const issuesWithUserNames = issues.map((issue) => ({
      ...issue,
      issueTypeName: issueTypeMap[issue.issueTypeId] || "Unknown Type",
      createdBy: userMap[issue.createdBy] || "Unknown User",
      assignedTo: userMap[issue.assignedTo] || "Unknown User",
      closedBy: userMap[issue.closedBy] || "Unknown User",
      openedBy: userMap[issue.openedBy] || "Unknown User",
      updatedBy: userMap[issue.updatedBy] || "Unknown User",
      ownerId: userMap[issue.ownerId] || "Unknown User",
    }));

    const attrDef = await getBim360ProjectIssuesAttributeDefinitions(projectId, token);

    const attributeValueMap = buildCustomAttributeValueMap(attrDef.results);

    const issuesWithReadableAttributes = enrichCustomAttributes(
      issuesWithUserNames,
      attributeValueMap
    );

    //console.log("Issues", issuesWithReadableAttributes);

    const existingItems = await queryDataService(
      accountId,
      projectId,
      "issues"
    );
    const idsExisting = existingItems.map((it) => it.id);

    //Get new Ids to insert
    const newIds = issuesWithReadableAttributes.map((i) => i.id);

    //Delete old items
    const idsToDelete = idsExisting.filter((id) => !newIds.includes(id));
    await Promise.all(
      idsToDelete.map((id) =>
        deleteDataItem(`${accountId}#${projectId}`, `issues#${id}`)
      )
    );

    //Upsert new items
    await Promise.all(
      issuesWithReadableAttributes.map((issue) => {
        const item = mapIssueToItem(issue, accountId, projectId);
        return saveDataItem(item);
      })
    );

    res.status(200).json({
      data: {
        issues: issuesWithReadableAttributes,
      },
      error: null,
      message: "Issues retrieved successfully",
    });
    } catch (err) {
    console.error("Error fetching project issues:", err);
    return res
        .status(500)
        .json({
        data: null,
        error: err.message,
        message: "Failed to fetch project issues.",
        });
    }
};
module.exports = { GetIssues };