const axios = require('axios');
const {getHubs} = require ("../../libs/datamanagement/hubs/get.hubs")
const {getAccountBim360Projects} = require("../../libs/bim360/account_admin/get.projects")
const { authorizedHub } = require("../../../const/hubs.const.js")

const GetBim360Projects = async (req, res) => {
    const token = req.cookies["access_token"];

    if (!token) {
        return res.status(401).json({ data: null, error: 'Unauthorized', message: 'No token' });
    }

    try {
        const hubs = await getHubs(token);
        if (hubs.data.length === 0) {
            return res.status(404).json({ error: 'No hubs found for the user.' });
        }

        //console.log ("Hubs", hubs)

        const targetHubs = hubs.data.filter((hub) =>
            authorizedHub.some((authHub) => authHub.id === hub.id)
        );

        if (targetHubs.length === 0) {
            return res.status(404).json({ data: null, error: 'HubNotFound', message: 'No authorized hubs found' });
        }

        //console.log ("Target Hubs", targetHubs)

        // Fetch projects for each authorized hub's account
        const projectPromises = targetHubs.map((hub) =>
            getAccountBim360Projects(token, hub.id)
                .catch((err) => {
                    console.error(`Error fetching projects for account ${hub.id}:`, err.message);
                    return [];
                })
        );
        const projectsList = await Promise.all(projectPromises);
        const allProjects = projectsList.flat();

        //console.log ("All project list", allProjects)

        return res.status(200).json({ data: allProjects, error: null, message: 'Projects retrieved successfully.' });
    } catch (err) {
        console.error('Error fetching projects:', err);
        return res.status(500).json({ data: null, error: err.message, message: 'Failed to fetch projects.' });
    }
};
module.exports = { GetBim360Projects };
