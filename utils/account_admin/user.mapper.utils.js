const { GetUserbyuserId } = require("./user.id.utils");

const mapUserIdsToNames = async (items, projectId, token) => {
  const userIds = new Set();

  items.forEach((item) => {
    if (item.userId) {
      userIds.add(item.userId);
    }
  });

  const uniqueUserIds = Array.from(userIds);
  const userMap = {};

  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const user = await GetUserbyuserId(userId, projectId, token);
        const name =
          user?.name || `${user.firstName || ""} ${user.lastName || ""}`.trim();
        userMap[userId] = name || "Unknown User";
      } catch {
        userMap[userId] = "Unknown User";
      }
    })
  );
  return userMap;
};

module.exports = { mapUserIdsToNames };
