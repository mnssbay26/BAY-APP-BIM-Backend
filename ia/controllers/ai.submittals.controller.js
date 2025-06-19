const { default: axios } = require("axios");
const { queryDataService } = require("../../services/dynamo/dynamo.service");

const TOKEN = process.env.BAYER_MY_GEN_TOKEN;
const BASE_URL = process.env.BAYER_MYGENASSIST_API_URL;
const TOOL_KEYS = [
  "fda_product_label",
  "pubmed_data_source",
  "uploaded_docs",
  "document_question_answering",
  "document_summarizer",
  "powerpointer",
  "pdf-generator",
];

const PostAiSubmittals = async (req, res) => {
  const { accountId, projectId, service, question } = req.body;

  if (!BASE_URL || !TOKEN) {
    return res.status(500).json({
      error: "Server misconfiguration",
      message: "Missing AI service URL or authentication token",
    });
  }
  if (!accountId || !projectId || !service || !question) {
    return res.status(400).json({
      error: "Bad Request",
      message:
        "Missing required fields: accountId, projectId, service, question",
    });
  }

  try {
    const items = await queryDataService(accountId, projectId, service);
    if (!items.length) {
      return res.status(404).json({
        error: "Not Found",
        message: "No submittals found for the specified account/project/service",
      });
    }

    const contextText = JSON.stringify(items, null, 2);
    const systemPrompt = `
You are an expert BIM 360 Submittals assistant. You will receive a JSON array of submittal records, each containing these fields:
- id, identifier
- title, description, state, priority
- createdAt, dueDate, updatedAt (ISO timestamps)
- createdByName, submitterByName, managerName, updatedByName, publishedByName, sentToReviewByName
- specIdentifier, specTitle
- customAttributes: array of {attributeDefinitionId, readableValue}
  
Read the data and the user’s question, then answer using **ONLY** the provided data.
• Return counts as numbers.
• Return lists as arrays.

Always answer in clear English.

Data:
${contextText}

Question:
${question}
    `.trim();

    const aiResp = await axios.post(
      `${BASE_URL}/chat/agent`,
      {
        messages: [
          {
            role: "system",
            content:
              "You are ChatGPT, a large language model trained by OpenAI. Respond using markdown.",
          },
          {
            role: "user",
            content: systemPrompt,
          },
        ],
        model: "gpt-4o",
        temperature: 0,
        stream: false,
        tool_keys: TOOL_KEYS,
        response_format: { type: "text" },
      },
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );

    const answer = aiResp.data.choices?.[0]?.message?.content;
    if (!answer) {
      return res.status(500).json({ error: "No response from AI." });
    }
    return res.json({ answer });
  } catch (err) {
    console.error("❌ Error calling AI (Submittals):", err.message);
    if (err.response) console.error(err.response.data);
    return res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data?.detail || err.message });
  }
};

module.exports = { PostAiSubmittals };
