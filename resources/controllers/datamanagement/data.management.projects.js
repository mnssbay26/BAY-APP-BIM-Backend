const {getHubs} = require ("../../libs/datamanagement/hubs/get.hubs")
const { getHubProjects } = require ("../../libs/datamanagement/projects/get.hub.projects")
const { authorizedHub } = require ("../../libs/datamanagement/hubs/authorized.hub")

const GetProjects = async (req, res) => {
    const token = req.cookies ["access_token"]
    
    try {
        const hubs = await getHubs (token)
        if (hubs.data.length === 0) {
            return res.status(404).json({ error: 'No hubs found for the user.' });
        }

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

        const projectsList = await Promise.all(targetHubs.map(hub => getHubProjects(token, hub.id)));
        const allProjects = projectsList.flat();
        
        return res.status(200).json({ data: allProjects, error: null, message: 'Projects retrieved successfully.' });
    }
    catch (err) {
        console.error("Error fetching projects:", err);
        return res.status(500).json({ data: null, error: err.message, message: 'Failed to fetch projects.' });
    }
};

module.exports = { GetProjects }

