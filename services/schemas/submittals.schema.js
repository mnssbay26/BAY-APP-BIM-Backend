const { sanitize } = require("../../utils/general/sanitaze.db")

const PK_ATTR = "accountId#projectId";
const SK_ATTR = "service#itemId";

function mapSubmittalToItem(submittal, accountId, projectId) {
  const pk = `${sanitize(accountId)}#${sanitize(projectId)}`;
  const sk = `submittal#${sanitize(submittal.id)}`;
  return {
    [PK_ATTR]: pk,
    [SK_ATTR]: sk,
    service: "submittals",
    accountId: sanitize(accountId),
    projectId: sanitize(projectId),
    id: sanitize(submittal.id),
    identifier: sanitize(submittal.identifier),
    title: sanitize(submittal.title),
    description: sanitize(submittal.description),
    state: sanitize(submittal.state),
    priority: sanitize(submittal.priority),
    customAttributes: Array.isArray(submittal.customAttributes)
      ? submittal.customAttributes.map(attr => ({
          attributeDefinitionId: sanitize(attr.attributeDefinitionId),
          value: sanitize(String(attr.value)),
          readableValue: sanitize(String(attr.readableValue || attr.value)),
        }))
      : [],
    specIdentifier: sanitize(submittal.specIdentifier),
    specTitle: sanitize(submittal.specTitle),
    submittedBy: sanitize(submittal.submittedBy),
    submitterByName: sanitize(submittal.submitterByName),
    submitterDueDate: submittal.submitterDueDate || new Date().toISOString(),
    managerName: sanitize(submittal.managerName),
    updatedByName: sanitize(submittal.updatedByName),
    publishedByName: sanitize(submittal.publishedByName),
    publishedDueDate: submittal.publishedDueDate || new Date().toISOString(),
    sentToReviewByName: sanitize(submittal.sentToReviewByName),
    createdByName: sanitize(submittal.createdByName),
    createdAt: submittal.createdAt || new Date().toISOString(),
    dueDate: submittal.dueDate || new Date().toISOString(),
    updatedAt: submittal.updatedAt || new Date().toISOString(),
  };
}

module.exports = { mapSubmittalToItem };