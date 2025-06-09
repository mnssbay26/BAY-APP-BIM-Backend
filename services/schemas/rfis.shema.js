const { sanitize } = require("../../utils/general/sanitaze.db");

const PK_ATTR = "accountId#projectId";
const SK_ATTR = "service#itemId";

function mapRfiToItem(rfi, accountId, projectId) {
  const pk = `${sanitize(accountId)}#${sanitize(projectId)}`;
  const sk = `rfi#${sanitize(rfi.id)}`;
  return {
    [PK_ATTR]: pk,
    [SK_ATTR]: sk,
    service: "rfis",
    accountId: sanitize(accountId),
    projectId: sanitize(projectId),
    customIdentifier: sanitize(rfi.customIdentifier),
    title: sanitize(rfi.title),
    discipline: Array.isArray(rfi.discipline)
      ? rfi.discipline.map((d) => sanitize(String(d)))
      : sanitize(String(rfi.discipline)),
    priority: sanitize(rfi.priority),
    status: sanitize(rfi.status),
    question: sanitize(rfi.question),
    officialResponse: sanitize(rfi.officialResponse),
    createdBy: sanitize(rfi.createdBy),
    assignedTo: sanitize(rfi.assignedTo),
    managerId: sanitize(rfi.managerId),
    respondedBy: sanitize(rfi.respondedBy),
    respondedAt: rfi.respondedAt || new Date().toISOString(),
    createdAt: rfi.createdAt || new Date().toISOString(),
    reviewerId: sanitize(rfi.reviewerId),
    updatedBy: sanitize(rfi.updatedBy),
    updatedAt: rfi.updatedAt || new Date().toISOString(),
    dueDate: rfi.dueDate || new Date().toISOString(),
    closedAt: rfi.closedAt || new Date().toISOString(),
    closedBy: sanitize(rfi.closedBy),
    coReviewers: Array.isArray(rfi.coReviewers)
      ? rfi.coReviewers.map((x) => sanitize(x))
      : [],
    reviewers: Array.isArray(rfi.reviewers)
      ? rfi.reviewers.map((u) => ({
          id: sanitize(u.id),
          displayName: sanitize(u.attributes?.displayName),
        }))
      : [],
    category: Array.isArray(rfi.category)
      ? rfi.category.map((c) => sanitize(c))
      : [sanitize(rfi.category)],
  };
}

module.exports = { mapRfiToItem };
