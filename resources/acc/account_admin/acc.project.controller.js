const { default: axios } = require("axios");
const { authorizedHub } = require("../../../const/hubs.const");

const GetProject = async (req, res) => {
  const token = req.cookies["access_token"];
  const accountId = req.params.accountId;
  const projectId = req.params.projectId;

  if (!token) {
    return res
      .status(401)
      .json({ data: null, error: "Unauthorized", message: "No token" });
  }

  try {
    const { data: projectdata } = await axios.get(
      `https://developer.api.autodesk.com/project/v1/hubs/${accountId}/projects/${projectId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    //console.debug("Project data:", projectdata);

    if (!projectdata || !projectdata.data) {
      return res.status(404).json({
        data: null,
        error: "ProjectNotFound",
        message: "Project not found or no data available",
      });
    }

    return res.status(200).json({
      data: {
        project: projectdata.data,
        id: projectdata.data.id,
        name: projectdata.data.attributes.name,
      },
      error: null,
      message: "Project retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching project:", err.message);
    if (err.response) {
      console.error("Autodesk response:", err.response.data);
    }
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to retrieve project",
    });
  }
};

module.exports = { GetProject };
