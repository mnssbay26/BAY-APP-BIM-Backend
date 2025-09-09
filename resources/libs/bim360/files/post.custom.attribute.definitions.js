const axios = require ("axios")

async function postBim360CustomAttributeDefinitions (token, projectId, folderId) {
    if (!token) throw new Error('Unauthorized: No token provided');
    if (!projectId) throw new Error('Project ID is required');
    if (!folderId) throw new Error('Folder ID is required');

    const payload = {
        "schema": {
            "type": "object",
            "properties": {
                "CostCenter": {
                    "type": "string",
                    "title": "Cost Center"
                },
                "WBS": {
                    "type": "string",
                    "title": "WBS"

            }
            }
        },
        "name": "Bayer Custom Attributes",
        "description": "Custom attributes for Bayer project folders"
    };

    const { data: customAttributeDefinition } = await axios.post(`${process.env.AUTODESK_BASE_URL}/bim360/docs/v1/projects/${projectId}/folders/${folderId}/custom-attribute-definitions`, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    return customAttributeDefinition;
}
module.exports = { postBim360CustomAttributeDefinitions };