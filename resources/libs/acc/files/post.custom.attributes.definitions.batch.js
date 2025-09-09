const axios = require ("axios")

async function postCustomAttributeDefinitionsBatch (token, projectId, versionId) {
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

    const { data: customAttributeDefinition } = await axios.post(`${process.env.AUTODESK_BASE_URL}/data/v1/projects/${projectId}/versions/${versionId}/custom-attributes:batch-update`, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    return customAttributeDefinition;
}
module.exports = { postCustomAttributeDefinitionsBatch };