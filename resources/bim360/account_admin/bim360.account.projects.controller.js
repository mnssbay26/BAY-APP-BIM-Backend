const axios = require("axios");
const { authorizedHub } = require("../../../const/hubs.const");

/**
 * Controller to fetch BIM360 projects from authorized hubs via Autodesk APS.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const GetProjects = async (req, res) => {
  const token = req.cookies["access_token"];

  if (!token) {
    return res
      .status(401)
      .json({ data: null, error: "Unauthorized", message: "No token" });
  }

  try {
    // Fetch all hubs
    const { data: hubsResponse } = await axios.get(
      "https://developer.api.autodesk.com/project/v1/hubs",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Filter only authorized hubs
    const targetHubs = hubsResponse.data.filter((hub) =>
      authorizedHub.some((authHub) => authHub.id === hub.id)
    );

    if (targetHubs.length === 0) {
      return res.status(404).json({
        data: null,
        error: "HubNotFound",
        message: "No authorized hubs found",
      });
    }

    // Parallel fetch of projects per hub
    const projectPromises = targetHubs.map((hub) =>
      axios
        .get(
          `https://developer.api.autodesk.com/project/v1/hubs/${hub.id}/projects`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((resp) => resp.data.data)
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

    // Filter BIM360 projects
    const bim360Projects = allProjects.filter(
      (project) => project.attributes?.extension?.data?.projectType === "BIM360"
    );

    return res.status(200).json({
      data: { projects: bim360Projects },
      error: null,
      message: "Access to BIM360 projects granted",
    });
  } catch (err) {
    console.error("Error fetching BIM360 projects:", err.message);
    return res.status(500).json({
      data: null,
      error: "InternalServerError",
      message: "Failed to retrieve BIM360 projects",
    });
  }
};

module.exports = { GetProjects };
