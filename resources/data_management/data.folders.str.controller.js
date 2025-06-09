const { default: axios } = require("axios");

const {
  GetFolderContent,
} = require("../../utils/account_admin/folder.content.utils");
const {
  GetFileVersions,
} = require("../../utils/account_admin/file.version.utils");

const GetFolderStructure = async (req, res) => {
  const token = req.cookies["access_token"];
  const accountId = req.params.accountId;
  let projectId = req.params.projectId;

  if (!token) {
    return res
      .status(401)
      .json({ data: null, error: "Unauthorized", message: "No token" });
  }

  try {
    const topFolders = await axios.get(
      `https://developer.api.autodesk.com/project/v1/hubs/${accountId}/projects/${projectId}/topFolders`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const foldersArray = topFolders.data.data;

    if (!foldersArray || foldersArray.length === 0) {
      return res.status(404).json({
        data: null,
        error: "NoTopFoldersFound",
        message: "The project does not have any top folders",
      });
    }

    const projectFolder = foldersArray.find(
      (f) =>
        f.attributes.displayName === "Project Files" ||
        f.attributes.displayName.toLowerCase() === "Archivos de proyecto"
    );

    const rootFolderId = projectFolder
      ? projectFolder.id
      : foldersArray.data[0].id;

    const projectStructure = await GetFolderContent(
      token,
      projectId,
      rootFolderId
    );

    const filesWithVersions = await Promise.all(
      projectStructure.map(async (item) => {
        if (item.type === "file") {
          const versions = await GetFileVersions(token, projectId, item.id);
          return {
            ...item,
            versions: versions,
          };
        }
        return item;
      })
    );

    res.status(200).json({
      data: filesWithVersions,
      error: null,
      message: "Project structure fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching folder structure:", err.message);
    if (err.response) {
      console.error("Autodesk response:", err.response.data);
    }
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Failed to retrieve folder structure",
    });
  }
};

module.exports = { GetFolderStructure };
