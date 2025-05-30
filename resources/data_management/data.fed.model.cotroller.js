const axios = require("axios");

const {
  GetFolderContent,
} = require("../../utils/account_admin/folder.content.utils");

const match_words = ["FED", "FEDERATED", "FEDERADO"];

function matchesFederated(displayName = "") {
  const nameUpper = displayName.toUpperCase();

  if (!nameUpper.endsWith(".NWD")) return false;

  return match_words.some((w) => nameUpper.includes(w));
}

const GetFederatedModel = async (req, res) => {
  const token = req.cookies["access_token"];
  const accountId = req.params.accountId;
  let projectId = req.params.projectId;

  if (!token) {
    return res
      .status(401)
      .json({ data: null, error: "Unauthorized", message: "No token" });
  }

  try {
    const { data: topFolders } = await axios.get(
      `https://developer.api.autodesk.com/project/v1/hubs/${accountId}/projects/${projectId}/topFolders`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!topFolders.data?.length) {
      return res.status(404).json({
        data: null,
        error: "No top folders found",
        message: "The project does not have any top folders",
      });
    }

    const projectFolder = topFolders.data.find(
      (f) =>
        f.attributes.displayName === "Project Files" ||
        f.attributes.displayName.toLowerCase() === "Archivos de proyecto"
    );

    const rootFolderId = projectFolder
      ? projectFolder.id
      : topFolders.data[0].id;

    const federatedModelFile = await GetFederatedModelFromFolders({
      token,
      projectId,
      folderId: rootFolderId,
      filterFn: (item) => matchesFederated(item.attributes?.displayName),
    });

    if (!federatedModelFile) {
      return res.status(404).json({
        data: null,
        error: "Federated model not found",
        message:
          "Federated model not found. Please ensure the project contains a federated model file.",
      });
    }

    const { data: fileversions } = await axios.get(
      `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${federatedModelFile.id}/versions`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!versions.data?.length) {
      return res.status(404).json({
        data: null,
        error: "No versions found",
        message: "No hay versiones para el archivo encontrado",
      });
    }

    const latestFileVersion = fileversions.data[0];

    return res.status(200).json({
      data: {
        federatedmodel: latestFileVersion.id,
        displayName: foundFile.attributes.displayName,
      },
      error: null,
      message: "Federated model retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching federated model:", err.message);
    if (err.response) {
      console.error("Autodesk response:", err.response.data);
    }
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to retrieve federated model",
    });
  }
};

module.exports = { GetFederatedModel };
