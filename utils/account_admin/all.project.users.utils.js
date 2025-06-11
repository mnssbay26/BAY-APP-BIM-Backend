const axios = require("axios");

const GetAllProjectUsers = async (token, projectId) => {
  if (!token) throw new Error("Unauthorized: No token provided");
  if (!projectId) throw new Error("Project ID is required");

  let allProjectUsers = [];
  let nextUrl = `https://developer.api.autodesk.com/construction/admin/v1/projects/${projectId}/users?limit=20&offset=0`;

  while (nextUrl) {
    const { data: users } = await axios.get(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const usersWithProjectId = users.results.map(user => ({
      ...user,
      projectId,
    }));

    allProjectUsers = allProjectUsers.concat(usersWithProjectId);
    nextUrl = users.pagination.nextUrl;
  }

  return allProjectUsers;
};

module.exports = { GetAllProjectUsers };