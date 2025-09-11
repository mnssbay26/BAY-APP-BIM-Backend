const axios = require('axios');

const { getBim360ProjectById } = require('../../../resources/libs/bim360/account_admin/get.project.id.js');

const GetProject = async (req, res) => {
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
        const projectdata = await getBim360ProjectById(token, accountId, projectId);

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
    console.error('Error fetching project data:', err);
    return res.status(500).json({ data: null, error: err.message, message: 'Failed to fetch project data.' });
  }
};
module.exports = { GetProject };