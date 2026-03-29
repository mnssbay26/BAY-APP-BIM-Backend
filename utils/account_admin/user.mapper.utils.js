const { getProjectUsers } = require("../../resources/libs/acc/account_admin/get.project.users");

const mapUserIdsToNames = async (items, projectId, token, userFields = []) => {
  const allUsers = await getProjectUsers(token, projectId);

  const userMap = {};
  allUsers.forEach((user) => {
    const name =
      user?.name ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      "Unknown User";
    if (user.id) userMap[user.id] = name;
    if (user.autodeskId) userMap[user.autodeskId] = name;
    if (user.analyticsId) userMap[user.analyticsId] = name;
  });

  return userMap;
};

module.exports = { mapUserIdsToNames };
