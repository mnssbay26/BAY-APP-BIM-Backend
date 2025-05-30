const express = require('express');
const axios = require('axios');

const GetFileVersions = async (token, projectId, fileId) => {
    try {
        const { data } = await axios.get(`https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${fileId}/versions`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return data.data; 
    } catch (error) {
        console.error('Error fetching file versions:', error.message || error);
        return []; 
    }
};

module.exports = { GetFileVersions };