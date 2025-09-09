const axios = require("axios");

const {
  saveDataItem,
  deleteDataItem,
  queryDataService,
} = require("../../../services/dynamo/dynamo.service");
const { mapUsersToIdem } = require("../../../services/schemas/users.schema");

const {
  getProjectUsers,
} = require("../../libs/acc/account_admin/get.project.users");

const GetProjectUsers = async (req, res) => {
  const token = req.cookies["access_token"];
  const accountId = req.params.accountId;
  const projectId = req.params.projectId;

  if (!toke) {
    return res
      .status(401)
      .json({ data: null, error: "Unauthorized", message: "No token" });
  }

  try {
    const projectUsers = await getProjectUsers(token, projectId);

    const existingItems = await queryDataService(accountId, projectId, "users");
    const idsExisting = existingItems.map((item) => item.userId);

    const newIds = projectUsers.map((user) => user.userId);

    const idsToDelete = idsExisting.filter((id) => !newIds.includes(id));
    await Promise.all(
      idsToDelete.map((id) =>
        deleteDataItem(`${accountId}#${projectId}`, `users#${id}`)
      )
    );

    await Promise.all(
      projectUsers.map((user) => {
        const item = mapUsersToIdem(user, accountId, projectId);
        return saveDataItem(item);
      })
    );

    return res.status(200).json({
      data: { users: projectUsers },
      error: null,
      message: "Project users retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching project users:", err);
    return res
      .status(500)
      .json({
        data: null,
        error: err.message,
        message: "Failed to fetch project users.",
      });
  }
};
module.exports = { GetProjectUsers };
