const axios = require('axios');

const { getProjectUsers } = require("../../../libs/acc/account_admin/get.project.users");
const { getProjectById } = require('../../../libs/bim360/account_admin/get.project.id');
const { getProjectCompanies } = require("../../../libs/acc/account_admin/get.project.companies");

const GetBim360ProjectData = async (req, res) => {
    const token = req.cookies["access_token"];
    const accountId = req.params.accountId;
    const projectId = req.params.projectId;

    if (!token) {
        return res.status(401).json({ data: null, error: 'Unauthorized', message: 'No token' });
    }
    if (!projectId) {
        return res.status(400).json({ data: null, error: 'BadRequest', message: 'No projectId provided' });
    }

    try {
        const project = await getProjectById(token, accountId, projectId);
        const projectUsers = await getProjectUsers(token, projectId);
        const projectCompanies = await getProjectCompanies(token, projectId);

        return res.status(200).json({ data:
            {
                users: projectUsers,
                companies: projectCompanies,
                project: project
             }, error: null, message: 'Project data retrieved successfully.' });
    }
    catch (err) {
        console.error('Error fetching project data:', err);
        return res.status(500).json({ data: null, error: err.message, message: 'Failed to fetch project data.' });
    }
};
module.exports = { GetBim360ProjectData };