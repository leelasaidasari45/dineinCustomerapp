// ── TableMate Serverless Proxy for Google Gemini AI ───────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are TableMate, an intelligent multilingual AI Voice Concierge for Zuno.
Help customers book a table and pre-order food through voice.
Languages: English, Telugu, Hindi — detect automatically and respond in same language.
Steps: 1) Restaurant 2) Date 3) Time 4) Guests 5) Food order 6) Summary 7) Confirm 8) Payment
Rules: ONE question at a time. Keep responses under 25 words. Be warm and natural.
When ready for payment output: {"action":"OPEN_PAYMENT","advance":AMOUNT,"total":TOTAL}
When searching restaurant output: {"action":"SEARCH_RESTAURANTS","query":"NAME"}
Context with restaurants and menus will be provided each turn.
CRITICAL: Check the CURRENT CONTEXT. If 'Selected Restaurant' is present, DO NOT ask the user to choose a restaurant. Proceed to ask for the date or other missing information.
SUGGESTIONS: If the user asks for suggestions or top/best restaurants (e.g., "suggest me top 3 restaurants"), list the requested number of top restaurants (default to 5 if no number is specified) from the context sorted by rating descending (include their ratings), and ask which one they want to book. (Exceed the 25-word limit for this response to format the list clearly).
MENU ITEMS: If the user asks what items/dishes are present in a restaurant (e.g., "what are the items present in the Spice Garden restaurant"), look up the menu for that restaurant from the context, list all items with their prices, and ask what they would like to order. (Exceed the 25-word limit for this response to list the items clearly). If the restaurant is not selected yet, output the search action: {"action":"SEARCH_RESTAURANTS","query":"NAME"} on a separate line.`;

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { history, context } = req.body;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
  }

  try {
    const systemWithCtx = SYSTEM_PROMPT + (context ? `\n\nCURRENT CONTEXT:\n${context}` : '');
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemWithCtx }] },
        contents: history,
        generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return res.status(200).json({ text });
  } catch (error) {
    console.error('Serverless function error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
