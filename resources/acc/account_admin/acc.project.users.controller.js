const { default: axios } = require("axios");

const {
  saveDataItem,
  deleteDataItem,
  queryDataService,
} = require("../../../services/dynamo/dynamo.service");
const { mapUsersToIdem  } = require("../../../services/schemas/users.schema");

const GetProjectUsers = async (req, res) => {
  const token = req.cookies["access_token"];
  const accountId = req.params.accountId;
  const projectId = req.params.projectId;

  if (!token) {
    return res
      .status(401)
      .json({ data: null, error: "Unauthorized", message: "No token" });
  }

   try {
    let allProjectUsers = [];
    let nextUrl = `	https://developer.api.autodesk.com/construction/admin/v1/projects/${projectId}/users?limit=20&offset=0`;

    while (nextUrl) {
      const { data: users } = await axios.get(nextUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const usersWithProjectId = users.results.map((user) => ({
        ...user,
        projectId: projectId,
      }));

      allProjectUsers = allProjectUsers.concat(usersWithProjectId);
      nextUrl = users.pagination.nextUrl;
    }

    //console.log("All project users:", allProjectUsers);

    const existingItems = await queryDataService(accountId, projectId, "users")
    const idsExisting = existingItems.map((item) => item.userId);

    const newIds = allProjectUsers.map((user) => user.userId);

    const idsToDelete = idsExisting.filter((id) => !newIds.includes(id));
    await Promise.all(
      idsToDelete.map((id) =>
        deleteDataItem(`${accountId}#${projectId}`, `users#${id}`)
      )
    );

    await Promise.all(
      allProjectUsers.map((user) => {
        const item = mapUsersToIdem(user, accountId, projectId);
        return saveDataItem(item);
      })
    );

    return res.status(200).json({
      data: { users: allProjectUsers },
      error: null,
      message: "Project users retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching project users:", err.message);
    if (err.response) {
      console.error("Autodesk response:", err.response.data);
    }
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to retrieve project users",
    });
  }
};

module.exports = { GetProjectUsers };
