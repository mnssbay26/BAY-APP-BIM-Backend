const axios = require("axios");
const { authorizedHub } = require("../../../const/hubs.const");

/**
 * Controller to fetch ACC projects from authorized hubs via Autodesk API.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const GetProjects = async (req, res) => {
  const token = req.cookies["access_token"];

  console.log("Received token:", token);

  if (!token) {
  return res
    .status(401)
    .json({ data: null, error: 'Unauthorized', message: 'No token' });
}

  try {
    const { data: hubsResponse } = await axios.get(
      "https://developer.api.autodesk.com/project/v1/hubs",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    //console.debug("Hubs response:", hubsResponse);

    const targetHubs = hubsResponse.data.filter((hub) =>
      authorizedHub.some((authHub) => authHub.id === hub.id)
    );

    //console.debug("Target hubs:", targetHubs);

    if (targetHubs.length === 0) {
      return res.status(404).json({
        data: null,
        error: "HubNotFound",
        message: "No authorized hubs found",
      });
    }

    // Fetch projects for each authorized hub
    const projectPromises = targetHubs.map((hub) =>
      axios
        .get(
          `https://developer.api.autodesk.com/project/v1/hubs/${hub.id}/projects`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((response) => response.data.data)
        .catch((err) => {
          console.error(
            `Error fetching projects for hub ${hub.id}:`,
            err.message
          );
          return [];
        })
    );

    const projectsList = await Promise.all(projectPromises);
    const allProjects = projectsList.flat();

    //console.debug("All projects:", allProjects);

    // Filter ACC projects
    const accProjects = allProjects.filter(
      (project) => project.attributes?.extension?.data?.projectType === "ACC"
    );

    return res.status(200).json({
      data: { projects: accProjects },
      error: null,
      message: "Access to ACC projects granted",
    });
  } catch (err) {
    console.error("Error fetching projects:", err.message);
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to retrieve ACC projects",
    });
  }
};

module.exports = { GetProjects };
