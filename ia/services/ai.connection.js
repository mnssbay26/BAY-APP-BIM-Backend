const axios = require('axios');

const API_KEY = process.env.BAYER_AI_KEY;
const API_URL = process.env.BAYER_AI_URL;

async function getAnswer(prompt) {
  try {
    const response = await axios.post(API_URL, { prompt }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response || !response.data) {
      throw new Error('No response from AI service');
    }

    if (response.data && response.data.choices) {
      return response.data.choices[0].message.content;
    }
    throw new Error('Respuesta inválida del servicio de IA');
  } catch (error) {
    console.error('Error en aiService.getAnswer:', error);
    throw new Error('Error al obtener respuesta de la IA');
  }
}

module.exports = { getAnswer };