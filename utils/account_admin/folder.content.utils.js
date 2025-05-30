const express = require('express');
const axios = require('axios');

const cache = {}

const  GetFolderContent = async (token, projectId, folderId) => { 
    const cacheKey = `${projectId}-${folderId}`;

    if (cache[cacheKey]) {
        return cache[cacheKey];
    }

    try {
        const { data: folderContent } = await axios.get(
            `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderId}/contents`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!folderContent || !folderContent.data) {
            throw new Error("Folder content not found or no data available");
        }

        const folders = folderContent.data.filter(item => item.type === 'folders');
        const files = folderContent.data.filter(item => item.type === 'items');

        const subfolders = await Promise.all(
            folders.map(async folder => ({
                id: folder.id,
                name: folder.attributes.name,
                type: 'folder',
                children: await GetFolderContent(token, projectId, folder.id),
            }))
        );

        const result = [
            ...subfolders,
            ...files.map(file => ({
                id: file.id,
                name: file.attributes.displayName,
                type: 'file',
                versiontype: file.attributes.extension.type === 'versions:autodesk.bim360:File' ? file.attributes.extension.data.id : null,
                version: file.attributes.extension.version,
                version_urn: file.relationships.tip.data.id,
                versionschema: file.attributes.extension.schema,
            })),
        ];

        cache[cacheKey] = result;

        return result;

    } catch (error) {
        console.error("Error fetching folder content:", error.message);
        if (error.response) {
            console.error("Autodesk response:", error.response.data);
        }
        throw new Error("Failed to retrieve folder content");
    }
}

module.exports = { GetFolderContent };
