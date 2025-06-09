const { default: axios } = require("axios");

const { GetIssuesTypeName } = require("../../../utils/issues/issue.type.name");
const {
  GetIssueAttributeDefinitions,
} = require("../../../utils/issues/issue.attribute.definition");

const {
  mapUserIdsToNames,
} = require("../../../utils/account_admin/user.mapper.utils");
const {
  fetchAllPaginatedResults,
} = require("../../../utils/general/pagination.utils");

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
  saveItem,
  deleteItem,
  queryService,
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
    const issues = await fetchAllPaginatedResults(
      `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issues`,
      token
    );

    if (!Array.isArray(issues) || issues.length === 0) {
      return res.status(200).json({
        data: { issues: [] },
        error: null,
        message: "No Issues found for this project",
      });
    }

    const issuesTypeNameData = await GetIssuesTypeName(projectId, token);

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

    const attrDef = await GetIssueAttributeDefinitions(projectId, token);

    const attributeValueMap = buildCustomAttributeValueMap(attrDef.results);

    const issuesWithReadableAttributes = enrichCustomAttributes(
      issuesWithUserNames,
      attributeValueMap
    );

    //console.log("Issues", issuesWithReadableAttributes);

    //Get existing items from DynamoDB
    const existingItems = await queryService(accountId, projectId, "issues");
    const idsExisting = existingItems.map((it) => it.id);

    //Get new Ids to insert
    const newIds = issuesWithReadableAttributes.map((i) => i.id);

    //Delete old items
    const idsToDelete = idsExisting.filter((id) => !newIds.includes(id));
    await Promise.all(
      idsToDelete.map((id) =>
        deleteItem(`${accountId}#${projectId}`, `issues#${id}`)
      )
    );

    //Upsert new items
    await Promise.all(
      issuesWithReadableAttributes.map((issue) => {
        const item = mapIssueToItem(issue, accountId, projectId);
        return saveItem(item);
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
    console.error("Error fetching issues:", err.message);
    if (err.response) {
      console.error("Autodesk response:", err.response.data);
    }
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to retrieve issues",
    });
  }
};

module.exports = { GetIssues };
