const axios = require('axios');

const  GetProjectReviews = async (token, projectId) => {
    const url = `https://developer.api.autodesk.com/construction/reviews/v1/projects/${projectId}/reviews`;
    
    const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    
    try {
        const { data } = await axios.get(url, { headers });
        if (!data || !data.data) {
        throw new Error('Reviews not found or no data available');
        }
        return data;
    } catch (error) {
        console.error('Error fetching project reviews:', error.message);
        if (error.response) {
        console.error('Autodesk response:', error.response.data);
        }
        throw new Error('Failed to retrieve project reviews');
    }
}

module.exports = { GetProjectReviews };