const { default: axios } = require("axios");
const { format } = require("morgan");

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
    let nextPageUrl = `https://developer.api.autodesk.com/construction/admin/v1/projects/${projectId}/users?limit=20&offset=0`;

    while (nextPageUrl) {
      const { data: users } = await axios.get(nextPageUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const usersWithProjectId = users.results.map((user) => ({
        ...user,
        projectId: projectId,
      }));

      allProjectUsers = allProjectUsers.concat(usersWithProjectId);
      nextPageUrl = users.pagination.nextUrl;
    }

    //console.log("Users:", allProjectUsers);

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
