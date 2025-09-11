const axios = require("axios");

const {
  GetFederatedModelFromFolders,
} = require("../../../utils/account_admin/fed.model.folders.utils");

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

      //console.log("Root folder ID:", rootFolderId);

      const { data: bimfolder } = await axios.get(
        `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${rootFolderId}/contents`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bim360FolderData = bimfolder.data.find(
        (f) =>
          f.attributes.displayName === "Y_BIM"
      );

      //console.log("BIM360 folder data:", bim360FolderData);

      const rootBimId = bim360FolderData
      ? bim360FolderData.id
      : bimfolder.data[0].id;

    const federatedModelFile = await GetFederatedModelFromFolders({
      token,
      projectId,
      folderId: rootBimId,
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

    //console.log ("Federated model", federatedModelFile);

    const { data: fileversions } = await axios.get(
      `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${federatedModelFile.id}/versions`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!fileversions.data?.length) {
      return res.status(404).json({
        data: null,
        error: "No versions found",
        message: "No hay versiones para el archivo encontrado",
      });
    }

    //console.log ("File versions:", fileversions);

    const latestFileVersion = fileversions.data[0];

    return res.status(200).json({
      data: {
        federatedmodel: latestFileVersion.id,
        displayName: federatedModelFile.attributes.displayName,
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
