// ── Gemini AI Client for TableMate ──────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are TableMate, an intelligent multilingual AI Voice Concierge for Zuno.
Help customers book a table and pre-order food through voice.
Languages: English, Telugu, Hindi — detect automatically and respond in same language.
Steps: 1) Restaurant 2) Date 3) Time 4) Guests 5) Food order 6) Summary 7) Confirm 8) Payment
Rules: ONE question at a time. Keep responses under 25 words. Be warm and natural.
When ready for payment output: {"action":"OPEN_PAYMENT","advance":AMOUNT,"total":TOTAL}
When searching restaurant output: {"action":"SEARCH_RESTAURANTS","query":"NAME"}
Context with restaurants and menus will be provided each turn.
CRITICAL: Check the CURRENT CONTEXT. If 'Selected Restaurant' is present, DO NOT ask the user to choose a restaurant. Proceed to ask for the date or other missing information.`;

// ── Try Gemini API, fall back to rule engine ──────────────────────────────────
export async function askTableMate(history, context) {
  const isValidKey = GEMINI_API_KEY
    && GEMINI_API_KEY.length > 10
    && GEMINI_API_KEY !== 'your_gemini_api_key_here'
    && GEMINI_API_KEY.startsWith('AIza');

  if (isValidKey) {
    try {
      const systemWithCtx = SYSTEM_PROMPT + (context ? `\n\nCURRENT CONTEXT:\n${context}` : '');
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemWithCtx }] },
          contents: history,
          generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
        }),
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}`);
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) return text;
    } catch (e) {
      console.warn('[TableMate] Gemini unavailable, using rule engine:', e.message);
    }
  }

  return ruleEngine(history, context || '');
}

// ── Smart Rule-Based Conversation Engine ─────────────────────────────────────
// Reads from context (built from bookingRef — always fresh)
function ruleEngine(history, ctx) {
  const lastUser = [...history].reverse().find(h => h.role === 'user')?.parts?.[0]?.text || '';
  const u = lastUser.toLowerCase();

  // ── Read current booking state from context ──
  const restaurantMatch = ctx.match(/Selected Restaurant: (.+?) \(ID:/);
  const dateMatch    = ctx.match(/Selected Date: (.+)/);
  const timeMatch    = ctx.match(/Selected Time: (.+)/);
  const guestsMatch  = ctx.match(/Guests: (\d+)/);
  const itemsMatch   = ctx.match(/Ordered Items:\n([\s\S]+?)(?:\n\n|$)/);
  const totalMatch   = ctx.match(/Total: ₹([\d,]+)/);

  const hasRestaurant = !!restaurantMatch;
  const hasDate       = !!dateMatch;
  const hasTime       = !!timeMatch;
  const hasGuests     = !!guestsMatch;
  const hasItems      = !!itemsMatch;
  const hasTotal      = !!totalMatch;

  const restaurantName = restaurantMatch?.[1]?.trim() || '';
  const dateVal  = dateMatch?.[1]?.trim() || '';
  const timeVal  = timeMatch?.[1]?.trim() || '';
  const guestsVal = guestsMatch?.[1]?.trim() || '';

  // ── Parse user input ──
  const isYes = /\b(yes|yeah|yep|correct|ok|okay|sure|confirm|proceed|haan|avunu)\b/.test(u);
  const isNo  = /\b(no|nope|change|wrong|different|nahi|kadhu)\b/.test(u);

  // Fuzzy matching helper
  const fuzzyMatch = (q, r) => {
    const cleanQ = q.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanR = r.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanQ === cleanR) return true;
    if (cleanQ.includes(cleanR)) return true;
    if (cleanQ.length >= 3 && cleanR.includes(cleanQ)) return true;
    const stripH = s => s.replace(/h/g, '');
    if (stripH(cleanQ) === stripH(cleanR)) return true;
    return false;
  };

  // Restaurant in user text
  const knownRestaurants = (ctx.match(/Name: (.+?) \|/g) || []).map(l => l.replace('Name: ','').replace(' |','').trim());
  const mentionedR = knownRestaurants.find(r => {
    const first = r.split(' ')[0].toLowerCase();
    const isStopWord = ['the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'at'].includes(first);
    return fuzzyMatch(u, r) || (!isStopWord && first.length >= 3 && fuzzyMatch(u, first));
  });
  const genericR = u.match(/\b(shadab|paradise|biryani|sai|spice|pizza|wok|south|burger|sweet)\b/i)?.[1];

  // Date
  const isToday    = /\btoday\b/.test(u);
  const isTomorrow = /\btomorrow\b/.test(u);
  const dayWord    = u.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/)?.[1];

  // Time
  const isLunch    = /\blunch\b/.test(u);
  const isDinner   = /\bdinner\b/.test(u);
  const isBreakfast= /\bbreakfast\b/.test(u);
  const timeNum    = u.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/);

  // Guests
  const numWords = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
  const guestNum = u.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:people|persons?|guests?|of us|pax)?/);
  const guestCount = guestNum ? (numWords[guestNum[1]] || parseInt(guestNum[1])) : null;

  // Food
  const foodList = ['biryani','idli','dosa','pizza','burger','chicken','paneer','rice','roti','naan','curry','dal','fish','mutton','veg','egg','cake','coffee','tea','lassi','juice'];
  const mentionedFood = foodList.filter(f => u.includes(f));
  const hasFood = mentionedFood.length > 0 || /\b(order|want|like|have|give me|i'll have|add)\b/.test(u);

  // ── STEP 1: Restaurant ──
  if (!hasRestaurant) {
    const name = mentionedR || genericR;
    if (name) {
      const clean = name.charAt(0).toUpperCase() + name.slice(1);
      return `{"action":"SEARCH_RESTAURANTS","query":"${clean}"}\nGreat choice! What date would you like to visit ${clean}?`;
    }

    // Check if user specified a name that we didn't recognize
    const attempt = u.match(/(?:visit|book|go to|at|restaurant|table at|named)\s+([a-z0-9\s]+)/i)?.[1]?.trim();
    if (attempt && !/\b(today|tomorrow|time|table|guest|people|food|order|menu|idly|dosa|biryani|burger)\b/.test(attempt)) {
      const list = knownRestaurants.length > 0
        ? knownRestaurants.join(', ')
        : 'Shadhab, Sri Sai Balaji Restaurant';
      return `I couldn't find "${attempt}" in our list. Available restaurants are: ${list}. Which one would you like to book?`;
    }

    if (/\b(list|show|which|what|available)\b/.test(u)) {
      const list = knownRestaurants.length > 0
        ? knownRestaurants.map(r => `• ${r}`).join('\n')
        : '• Shadhab\n• Sri Sai Balaji Restaurant';
      return `Available restaurants:\n${list}\n\nWhich one would you like to visit?`;
    }
    return "Which restaurant would you like to visit? Say a name like Shadhab or Sri Sai Balaji.";
  }

  // ── STEP 2: Date ──
  if (!hasDate) {
    if (isToday)    return `Perfect — today! What time would you like to arrive at ${restaurantName}?`;
    if (isTomorrow) return `Tomorrow it is! What time would you like to arrive?`;
    if (dayWord)    return `${dayWord.charAt(0).toUpperCase()+dayWord.slice(1)} works! What time?`;
    if (isLunch || isDinner || timeNum) return `I'll book for today. What time exactly?`;
    return `What date would you like to visit ${restaurantName}? Say today, tomorrow, or a day.`;
  }

  // ── STEP 3: Time ──
  if (!hasTime) {
    if (isBreakfast) return `Breakfast at 9:00 AM — noted! How many guests will be dining?`;
    if (isLunch)     return `Lunch at 1:00 PM — noted! How many guests will be dining?`;
    if (isDinner)    return `Dinner at 7:30 PM — noted! How many guests will be dining?`;
    if (timeNum) {
      const h = timeNum[1], m = timeNum[2] || '00';
      const ap = /pm|p\.m\./i.test(u) ? 'PM' : 'AM';
      return `${h}:${m} ${ap} — perfect! How many guests will be dining?`;
    }
    return `What time would you like to arrive? Say a time like 7 PM or 1:30 PM.`;
  }

  // ── STEP 4: Guests ──
  if (!hasGuests) {
    if (guestCount) return `Table for ${guestCount} — done! What would you like to eat?`;
    return `How many guests will be dining? Say a number like 2 or "three people".`;
  }

  // ── STEP 5: Food ──
  if (!hasItems) {
    if (hasFood && lastUser.length > 3) {
      const food = mentionedFood.length > 0
        ? mentionedFood.map(f => f.charAt(0).toUpperCase()+f.slice(1)).join(', ')
        : lastUser.trim();
      return `Got it — ${food}! Anything else to add, or say "that's all" to continue.`;
    }
    return `What would you like to eat? Tell me the dish names and quantity.`;
  }

  // ── STEP 6: Summary ──
  if (hasItems && !hasTotal) {
    if (isYes || /that.?s all|nothing|done|proceed|summary|no more/.test(u)) {
      const items = itemsMatch?.[1]?.split('\n').filter(Boolean).map(l => l.trim()).join('\n') || 'As ordered';
      const g = parseInt(guestsVal) || 2;
      const total = g * 450;
      const adv   = Math.round(total * 0.5);
      return `Here's your booking summary:

🏨 Restaurant: ${restaurantName}
📅 Date: ${dateVal}
⏰ Time: ${timeVal}
👥 Guests: ${guestsVal}
🍽️ Food:
${items}
💰 Total: ₹${total}
💳 Advance (50%): ₹${adv}

Is everything correct? Say yes to pay.`;
    }
    if (hasFood) {
      const food = mentionedFood.length > 0
        ? mentionedFood.map(f => f.charAt(0).toUpperCase()+f.slice(1)).join(', ')
        : lastUser.trim();
      return `Added ${food}! Anything else, or say "that's all" to see the summary.`;
    }
    return `Any special instructions? Or say "that's all" to see your booking summary.`;
  }

  // ── STEP 7: Payment ──
  if (hasTotal) {
    if (isYes) {
      const total = parseInt(totalMatch?.[1]?.replace(',','') || '900');
      const adv   = Math.round(total * 0.5);
      return `{"action":"OPEN_PAYMENT","advance":${adv},"total":${total}}\nOpening the payment window for ₹${adv} advance now!`;
    }
    if (isNo) return `What would you like to change — restaurant, date, time, guests, or food?`;
  }

  // ── Corrections ──
  if (isNo || /change|modify|update|wrong/.test(u)) {
    return `What would you like to change — restaurant, date, time, guests, or food?`;
  }

  // ── Fallback to next missing step ──
  if (!hasDate)   return `What date would you like to visit ${restaurantName}?`;
  if (!hasTime)   return `What time would you like to arrive?`;
  if (!hasGuests) return `How many guests will be dining?`;
  if (!hasItems)  return `What would you like to eat?`;
  return `Shall I show you the booking summary? Say yes to proceed.`;
}

// ── Parse action JSON from response ──────────────────────────────────────────
export function parseResponse(rawText) {
  const actions = [];
  const spokenLines = [];

  for (const line of rawText.split('\n')) {
    const t = line.trim();
    if (t.startsWith('{') && t.endsWith('}')) {
      try {
        const a = JSON.parse(t);
        if (a.action) { actions.push(a); continue; }
      } catch (_) {}
    }
    spokenLines.push(line);
  }

  return { spokenText: spokenLines.join('\n').trim(), actions };
}
