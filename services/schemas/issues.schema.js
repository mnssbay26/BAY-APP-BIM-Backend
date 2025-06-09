const { sanitize } = require("../../utils/general/sanitaze.db");

const PK_ATTR = "accountId#projectId";
const SK_ATTR = "service#itemId";

function mapIssueToItem(issue, accountId, projectId) {
  const pk = `${sanitize(accountId)}#${sanitize(projectId)}`;
  const sk = `issue#${sanitize(issue.id)}`;
  return {
    [PK_ATTR]: pk,
    [SK_ATTR]: sk,
    service: "issues",
    accountId: sanitize(accountId),
    projectId: sanitize(projectId),
    id: sanitize(issue.id),
    title: sanitize(issue.title),
    displayId: sanitize(issue.displayId),
    description: sanitize(issue.description),
    status: sanitize(issue.status),
    issueTypeName: sanitize(issue.issueTypeName),
    createdAt: issue.createdAt || new Date().toISOString(),
    createdBy: sanitize(issue.createdBy),
    openedBy: sanitize(issue.openedBy),
    assignedTo: sanitize(issue.assignedTo),
    closedBy: sanitize(issue.closedBy),
    dueDate: issue.dueDate || new Date().toISOString(),
    updatedAt: issue.updatedAt || new Date().toISOString(),
    updatedBy: sanitize(issue.updatedBy),
    closedAt: issue.closedAt || new Date().toISOString(),

    customAttributes: Array.isArray(issue.customAttributes)
      ? issue.customAttributes.map(attr => ({
          attributeDefinitionId: sanitize(attr.attributeDefinitionId),
          rawValue: sanitize(String(attr.value)),
          title: sanitize(attr.title),
          readableValue: sanitize(String(attr.readableValue || attr.value))
        }))
      : [],
  };
}

module.exports = { mapIssueToItem };
