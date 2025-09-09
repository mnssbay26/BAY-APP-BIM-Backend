const axios = require('axios');
const {getHubs} = require ("../../libs/datamanagement/hubs/get.hubs")
const {getAccountProjects} = require("../../libs/acc/account_admin/get.projects")
const { authorizedHub } = require("../../libs/auth/auth.hub")

const GetAccProjects = async (req, res) => {
    const token = req.cookies["access_token"];
    
    if (!token) {
        return res.status(401).json({ data: null, error: 'Unauthorized', message: 'No token' });
    }

    try {

        const hubs = await getHubs(token);
        if (hubs.data.length === 0) {
            return res.status(404).json({ error: 'No hubs found for the user.' });
        }

        const targetHubs = hubs.data.filter((hub) =>
            authorizedHub.some((authHub) => authHub.id === hub.id)
        );

        if (targetHubs.length === 0) {
            return res.status(404).json({ data: null, error: 'HubNotFound', message: 'No authorized hubs found' });
        }

        // Fetch projects for each authorized hub's account
        const projectPromises = targetHubs.map((hub) =>
            getAccountProjects(token, hub.attributes.accountId)
                .catch((err) => {   
                    console.error(`Error fetching projects for account ${hub.attributes.accountId}:`, err.message);
                    return [];
                })
        );
        const projectsList = await Promise.all(projectPromises);
        const allProjects = projectsList.flat();

        return res.status(200).json({ data: allProjects, error: null, message: 'Projects retrieved successfully.' });
    } catch (err) {
        console.error('Error fetching projects:', err);
        return res.status(500).json({ data: null, error: err.message, message: 'Failed to fetch projects.' });
    }
};
module.exports = { GetAccProjects };
