const  express = require ("express");

const  { queryService } = require ("../../services/dynamo/dynamo.service");
const  { getAnswer } = require ("../services/ai.connection");

const  PostAiIssues = async (req, res) => {
    try {
        const {message, accountId, projectId} = req.body;

        if (!message || !accountId || !projectId) {
            return res.status(400).json({ error: "Missing required fields: message, accountId, or projectId" });
        }

        const service = "issues";
        const items = await queryService(accountId, projectId, service);

        if (items.length === 0) {
            return res.status(404).json({ error: "No issues found for the specified account and project" });
        }

        


    } catch (error) {
        console.error("Error processing AI issues:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}