const { sanitize } = require("../../utils/general/sanitaze.db")

const PK_ATTR = "accountId#projectId";
const SK_ATTR = "service#itemId";

function mapUsersToIdem (user, accountId, projectId) {
  const pk = `${sanitize(accountId)}#${sanitize(projectId)}`;
  const sk = `user#${sanitize(user.id)}`;
  return {
    [PK_ATTR]: pk,
    [SK_ATTR]: sk,
    service: "users",
    accountId: sanitize(accountId),
    projectId: sanitize(projectId),
    id: sanitize(user.id),
    name: sanitize(user.name),
    firstName: sanitize(user.firstName),
    lastName: sanitize(user.lastName),
    status: sanitize(user.status),
    companyName: sanitize(user.companyName),
    email: sanitize(user.email),
    roles: Array.isArray(user.roles)
      ? user.roles.map(r => ({
          id: sanitize(r.id),
          name: sanitize(r.name)
        }))
      : user.role
        ? [ sanitize(user.role) ]
        : [],
    
    accessLevels: Array.isArray(user.accessLevel)
      ? user.accessLevel.map(al => sanitize(al))
      : user.accessLevel
        ? [ sanitize(user.accessLevel) ]
        : [],
  };
}

module.exports = { mapUsersToIdem };