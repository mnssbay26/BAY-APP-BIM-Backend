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

const PostAiIssues = async (req, res) => {
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
        message: "No items found for the specified account/project/service",
      });
    }

    const contextText = JSON.stringify(items, null, 2);
    const systemPrompt = `
        You are an expert BIM 360 assistant. You will receive a JSON array of issue records, each containing these fields:
        - id (string)
        - title (string)
        - description (string)
        - status (string: "open" or "closed")
        - createdAt, dueDate, updatedAt, closedAt (ISO timestamps)
        - assignedTo, openedBy, createdBy, closedBy, updatedBy (usernames)
        - customAttributes: array of { title, readableValue }

        Read the data and the user’s question, then answer using **ONLY** the provided data.  
        • If the question asks for counts, provide a number.  
        • If it asks for lists, provide an array of objects or IDs.  
        • If it asks for percentages, calculate to one decimal place.  
        
        Always answer in clear English.

        Data:
        ${contextText}

        Question:
        ${question}
        `.trim();

    const url = `${BASE_URL}/chat/agent`;

    const aiResp = await axios.post(
      url,
      {
        messages: [
          {
            role: "system",
            content:
              "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using markdown.",
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
          //"mga-project": TOKEN,
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );

    const reply = aiResp.data.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ error: "No response from AI." });
    }

    return res.json({ answer: reply });
  } catch (err) {
    console.error("❌ Error calling AI:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status, err.response.data);
    }
    return res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data?.detail || err.message });
  }
};

module.exports = { PostAiIssues };
