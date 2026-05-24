const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function getMatchAnalysis(matchData) {
  if (!GROQ_API_KEY) {
    return 'AI analysis is not configured. Please add GROQ_API_KEY in environment.';
  }

  const home = matchData.homeTeam?.name || 'Home Team';
  const away = matchData.awayTeam?.name || 'Away Team';
  const comp = matchData.competition?.name || 'Unknown Competition';
  const date = new Date(matchData.utcDate).toLocaleString();

  const prompt = `You are a professional football analyst. Analyze this upcoming match and give a concise, helpful prediction.

Match: ${home} vs ${away}
Competition: ${comp}
Date: ${date}

Give your response in this format:
1. **Predicted Winner** (Home / Draw / Away) with confidence %
2. **Key Factors** (3 bullet points)
3. **Recommended Bet** (short advice)
4. **Risk Level** (Low / Medium / High)

Keep it under 200 words. Be direct and useful for betting decisions.`;

  try {
    const response = await axios.post(GROQ_URL, {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert football betting analyst." },
        { role: "user", content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Groq AI Error:', error.response?.data || error.message);
    const groqError = error.response?.data?.error?.message || 'Unknown error';
    return `AI analysis failed: ${groqError}`;
  }
}

module.exports = { getMatchAnalysis };
