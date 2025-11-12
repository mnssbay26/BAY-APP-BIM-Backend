const axios = require("axios");

const DEFAULT_TOOL_KEYS = [
  "fda_product_label","pubmed_data_source","uploaded_docs",
  "document_question_answering","document_summarizer","powerpointer","pdf-generator",
];

async function callMyGenAssist({ prompt, model = "gpt-4o", tool_keys = DEFAULT_TOOL_KEYS }) {
  const BASE_URL = process.env.BAYER_MYGENASSIST_API_URL;
  const TOKEN   = process.env.BAYER_MY_GEN_TOKEN;
  if (!BASE_URL || !TOKEN) throw new Error("myGenAssist misconfigured (URL/TOKEN).");

  const { data } = await axios.post(
    `${BASE_URL}/chat/agent`,
    {
      messages: [
        { role: "system", content: "You are ChatGPT, respond using markdown." },
        { role: "user", content: prompt },
      ],
      model, temperature: 0, stream: false,
      tool_keys, response_format: { type: "text" },
    },
    { headers: { accept: "application/json","Content-Type":"application/json", Authorization:`Bearer ${TOKEN}` }, timeout: 30000 }
  );

  return data?.choices?.[0]?.message?.content || "";
}

module.exports = { callMyGenAssist };