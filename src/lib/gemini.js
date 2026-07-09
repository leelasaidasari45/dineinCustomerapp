// ── Gemini AI Client for TableMate ──────────────────────────────────────────
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

// ── Try serverless proxy, fallback to local direct call or rule engine ────────
export async function askTableMate(history, context) {
  const localKey = import.meta.env.VITE_GEMINI_API_KEY;
  const isLocalDev = import.meta.env.DEV;

  // In local development, fallback to direct client-side requests if a local key is present in .env
  if (isLocalDev && localKey && localKey.length > 10 && localKey !== 'your_gemini_api_key_here' && localKey.startsWith('AIza')) {
    try {
      const systemWithCtx = SYSTEM_PROMPT + (context ? `\n\nCURRENT CONTEXT:\n${context}` : '');
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${localKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemWithCtx }] },
          contents: history,
          generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return text;
      }
    } catch (e) {
      console.warn('[TableMate] Direct local Gemini call failed:', e.message);
    }
  }

  // Production Secure Route: call the Serverless proxy function
  try {
    const res = await fetch('/api/tablemate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, context }),
    });
    if (!res.ok) throw new Error(`Serverless proxy status ${res.status}`);
    const data = await res.json();
    if (data.text) return data.text;
  } catch (e) {
    console.warn('[TableMate] Serverless proxy unavailable, using rule engine:', e.message);
  }

  return ruleEngine(history, context || '');
}

const FALLBACK_MENUS = {
  // South Indian / Breakfast
  'south spice': [
    { name: 'Idly (2 pcs)', price: '80' },
    { name: 'Masala Dosa', price: '110' },
    { name: 'Mysore Bajji', price: '90' },
    { name: 'Filter Coffee', price: '50' }
  ],
  'chutneys': [
    { name: 'Ghee Karam Masala Dosa', price: '110' },
    { name: 'Steamed Ghee Idly (2 pcs)', price: '60' },
    { name: 'Crispy Medu Vada (2 pcs)', price: '70' },
    { name: 'Authentic Filter Coffee', price: '40' }
  ],
  'minerva': [
    { name: 'Ghee Karam Masala Dosa', price: '110' },
    { name: 'Steamed Ghee Idly (2 pcs)', price: '60' },
    { name: 'Crispy Medu Vada (2 pcs)', price: '70' },
    { name: 'Authentic Filter Coffee', price: '40' }
  ],
  'taj mahal': [
    { name: 'Ghee Karam Masala Dosa', price: '110' },
    { name: 'Steamed Ghee Idly (2 pcs)', price: '60' },
    { name: 'Crispy Medu Vada (2 pcs)', price: '70' },
    { name: 'Authentic Filter Coffee', price: '40' }
  ],
  'subayya': [
    { name: 'Ghee Karam Masala Dosa', price: '110' },
    { name: 'Steamed Ghee Idly (2 pcs)', price: '60' },
    { name: 'Crispy Medu Vada (2 pcs)', price: '70' },
    { name: 'Authentic Filter Coffee', price: '40' }
  ],

  // Biryani / Mughlai
  'spice garden': [
    { name: 'Paneer Tikka', price: '280' },
    { name: 'Chicken Seekh Kebab', price: '340' },
    { name: 'Dal Makhani', price: '280' },
    { name: 'Chicken Biryani', price: '420' },
    { name: 'Paneer Butter Masala', price: '320' },
    { name: 'Garlic Naan', price: '60' }
  ],
  'shadhab': [
    { name: 'Special Chicken Biryani', price: '290' },
    { name: 'Special Mutton Biryani', price: '340' },
    { name: 'Chicken Tikka Kebab', price: '250' },
    { name: 'Garlic Butter Naan', price: '60' }
  ],
  'bawarchi': [
    { name: 'Special Chicken Biryani', price: '290' },
    { name: 'Special Mutton Biryani', price: '340' },
    { name: 'Chicken Tikka Kebab', price: '250' },
    { name: 'Garlic Butter Naan', price: '60' }
  ],
  'paradise': [
    { name: 'Special Chicken Biryani', price: '290' },
    { name: 'Special Mutton Biryani', price: '340' },
    { name: 'Chicken Tikka Kebab', price: '250' },
    { name: 'Garlic Butter Naan', price: '60' }
  ],
  'shah ghouse': [
    { name: 'Special Chicken Biryani', price: '290' },
    { name: 'Special Mutton Biryani', price: '340' },
    { name: 'Chicken Tikka Kebab', price: '250' },
    { name: 'Garlic Butter Naan', price: '60' }
  ],
  'cafe bahar': [
    { name: 'Special Chicken Biryani', price: '290' },
    { name: 'Special Mutton Biryani', price: '340' },
    { name: 'Chicken Tikka Kebab', price: '250' },
    { name: 'Garlic Butter Naan', price: '60' }
  ],
  'mehfil': [
    { name: 'Special Chicken Biryani', price: '290' },
    { name: 'Special Mutton Biryani', price: '340' },
    { name: 'Chicken Tikka Kebab', price: '250' },
    { name: 'Garlic Butter Naan', price: '60' }
  ],

  // Pizza / Burgers / Western / Cafe
  'the pizza republic': [
    { name: 'Garlic Bread', price: '150' },
    { name: 'Chicken Wings', price: '320' },
    { name: 'Margherita Pizza', price: '350' },
    { name: 'BBQ Chicken Pizza', price: '450' },
    { name: 'Classic Smash Burger', price: '280' }
  ],
  'burger barn': [
    { name: 'Classic Beef Burger', price: '250' },
    { name: 'Spicy Chicken Burger', price: '270' },
    { name: 'Veg Cheese Burger', price: '220' },
    { name: 'French Fries', price: '120' }
  ],
  'concu': [
    { name: 'Classic Margherita Pizza', price: '290' },
    { name: 'Double Cheese Burger', price: '160' },
    { name: 'Chicken Alfredo Pasta', price: '260' },
    { name: 'Chilli Garlic Hakka Noodles', price: '180' }
  ],
  'roastery': [
    { name: 'Classic Margherita Pizza', price: '290' },
    { name: 'Double Cheese Burger', price: '160' },
    { name: 'Chicken Alfredo Pasta', price: '260' },
    { name: 'Chilli Garlic Hakka Noodles', price: '180' }
  ],

  // Sweet / Desserts
  'sweet cravings': [
    { name: 'Chocolate Fudge Cake', price: '180' },
    { name: 'Red Velvet Pastry', price: '150' },
    { name: 'Vanilla Ice Cream scoop', price: '90' },
    { name: 'Mango Milkshake', price: '140' }
  ],
  'cream stone': [
    { name: 'Chocolate Fudge Cake', price: '180' },
    { name: 'Red Velvet Pastry', price: '150' },
    { name: 'Vanilla Ice Cream scoop', price: '90' },
    { name: 'Mango Milkshake', price: '140' }
  ]
};

function getFallbackMenu(restaurantName) {
  const name = (restaurantName || '').toLowerCase();
  for (const [key, value] of Object.entries(FALLBACK_MENUS)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }
  if (name.includes('biryani') || name.includes('mughlai') || name.includes('kebab')) {
    return FALLBACK_MENUS['shadhab'];
  }
  if (name.includes('dosa') || name.includes('idly') || name.includes('south') || name.includes('coffee')) {
    return FALLBACK_MENUS['south spice'];
  }
  return FALLBACK_MENUS['concu'];
}

// ── Smart Rule-Based Conversation Engine ─────────────────────────────────────
// Reads from context (built from bookingRef — always fresh)
function ruleEngine(history, ctx) {
  const lastUser = [...history].reverse().find(h => h.role === 'user')?.parts?.[0]?.text || '';
  const u = lastUser.toLowerCase();

  // ── Smart Suggestion Check ──
  const isSuggestRequest = (
    /\b(suggest|recommend|show|list|tell|give|top|best|highest|rated|rating|popular|famous)\b/i.test(u) ||
    /టాప్|ఉత్తమ|బెస్ట్|అత్యుత్తమ|టాప్|अच्छे|बेस्ट|टॉप/i.test(u)
  ) && (
    /\b(restaurants?|places?|hotels?|eating|dining)\b/i.test(u) ||
    /రెస్టారెం|రెస్టారెంట్|रेस्टोरेंट|रेस्टोरेंट्स/i.test(u)
  );

  if (isSuggestRequest) {
    const rList = [];
    const lines = ctx.split('\n');
    for (const line of lines) {
      if (line.includes('Name:') && line.includes('Rating:')) {
        const namePart = line.match(/Name:\s*(.*?)\s*\|/);
        const ratingPart = line.match(/Rating:\s*([\d.]+)/);
        if (namePart && ratingPart) {
          rList.push({
            name: namePart[1].trim(),
            rating: parseFloat(ratingPart[1]) || 0
          });
        }
      }
    }

    const fallbackRestaurants = [
      { name: 'Sweet Cravings', rating: 4.7 },
      { name: 'South Spice', rating: 4.6 },
      { name: 'Spice Garden', rating: 4.5 },
      { name: 'The Pizza Republic', rating: 4.3 },
      { name: 'Wok & Roll', rating: 4.1 },
      { name: 'Burger Barn', rating: 4.0 }
    ];

    const numMatch = u.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
    const wordNums = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    let limit = 5;
    if (numMatch) {
      const val = numMatch[1].toLowerCase();
      limit = wordNums[val] || parseInt(val) || 5;
    }

    const listToUse = rList.length > 0 ? rList : fallbackRestaurants;
    const sorted = [...listToUse].sort((a, b) => b.rating - a.rating);
    const topN = sorted.slice(0, limit);

    const isTelugu = /[\u0C00-\u0C7F]/.test(u) || /\b(avunu|kadhu|cheppandi)\b/i.test(u);
    const isHindi = /[\u0900-\u097F]/.test(u) || /\b(haan|nahi|kijiye|suno)\b/i.test(u);

    const listStr = topN.map((r, i) => `${i + 1}. ${r.name} (${r.rating} ⭐)`).join('\n');

    if (isTelugu) {
      return `రేటింగ్‌ల ఆధారంగా టాప్ ${limit} రెస్టారెంట్లు ఇక్కడ ఉన్నాయి:\n${listStr}\n\nమీరు ఏ రెస్టారెంట్‌ను బుక్ చేయాలనుకుంటున్నారు?`;
    } else if (isHindi) {
      return `रेटिंग के आधार पर टॉप ${limit} रेस्टोरेंट यहां दिए गए हैं:\n${listStr}\n\nआप कौन सा रेस्टोरेंट बुक करना चाहेंगे?`;
    } else {
      return `Here are the top ${limit} restaurants based on ratings:\n${listStr}\n\nWhich one would you like to visit?`;
    }
  }

  // ── Smart Menu Items Query Check ──
  const isMenuQuery = /\b(menu|items|dishes|food|list|card|available|serve|serves|have|present|eat)\b/i.test(u) &&
                      !/\b(order|add|want\s+to\s+order|want\s+to\s+add)\b/i.test(u);

  // Parse current restaurant from context if any
  const currentRestaurantMatch = ctx.match(/Selected Restaurant: (.+?) \(ID:/);
  const currentRestaurantName = currentRestaurantMatch?.[1]?.trim() || '';

  // Parse all available restaurants from context
  const dbRestaurants = [];
  const linesForNames = ctx.split('\n');
  for (const line of linesForNames) {
    if (line.includes('Name:') && line.includes('Rating:')) {
      const namePart = line.match(/Name:\s*(.*?)\s*\|/);
      if (namePart) {
        dbRestaurants.push(namePart[1].trim());
      }
    }
  }

  // Predefined known restaurant names (DB seed names + mock names)
  const fallbackNames = [
    'Spice Garden', 'The Pizza Republic', 'Wok & Roll', 'South Spice', 'Burger Barn', 'Sweet Cravings',
    'Shadhab', 'Bawarchi Restaurant', 'Paradise Biryani', 'Shah Ghouse', 'Cafe Bahar', 'Pista House',
    'Chutneys', 'Minerva Coffee Shop', 'Taj Mahal Hotel', 'Subayya Gari Hotel', 'Rayalaseema Ruchulu',
    'Mehfil Restaurant', 'Absolute Barbecues', 'Barbeque Nation', 'Concu', 'Roastery Coffee House',
    'Cream Stone', 'Exotica', 'SodaBottleOpenerWala', 'Olive Bistro', 'Flea Bazaar Cafe',
    'Santosh Dhaba', 'Nanking Restaurant', 'Ohris Jiva Imperia', 'Gusto Latino', 'Wok to Walk',
    'Sri Sai Balaji Restaurant'
  ];

  const allKnownNames = dbRestaurants.length > 0 ? dbRestaurants : fallbackNames;
  const sortedKnownNames = [...allKnownNames].sort((a, b) => b.length - a.length);

  // Extract candidate restaurant name from the user message if they mentioned one
  let queryRestaurantName = null;
  const attemptedMatch = u.match(/(?:in|at|present in|menu of|items at|items in)\s+(?:the\s+)?([a-z0-9\s&]+?)(?:\s+restaurant|\s+hotel|\s+cafe|\s+place|$)/i);
  let attemptedName = null;
  if (attemptedMatch) {
    const candidate = attemptedMatch[1].trim();
    if (candidate.length > 2 && !/\b(today|tomorrow|time|table|guest|people|food|order|menu|items|dishes)\b/.test(candidate)) {
      attemptedName = candidate;
    }
  }

  if (attemptedName) {
    queryRestaurantName = sortedKnownNames.find(name =>
      fuzzyMatch(attemptedName, name) ||
      fuzzyMatch(attemptedName.split(' ')[0], name)
    );
  } else {
    queryRestaurantName = sortedKnownNames.find(name => {
      const cleanName = name.toLowerCase();
      const firstWord = cleanName.split(' ')[0];
      return u.includes(cleanName) || (firstWord.length >= 3 && u.includes(firstWord));
    });
  }

  if (isMenuQuery) {
    if (attemptedName && !queryRestaurantName) {
      const isTelugu = /[\u0C00-\u0C7F]/.test(u) || /\b(avunu|kadhu|cheppandi)\b/i.test(u);
      const isHindi = /[\u0900-\u097F]/.test(u) || /\b(haan|nahi|kijiye|suno)\b/i.test(u);
      const list = allKnownNames.slice(0, 5).join(', ');
      
      if (isTelugu) {
        return `నేను "${attemptedName}" రెస్టారెంట్‌ను కనుగొనలేకపోయాను. అందుబాటులో ఉన్నవి: ${list}.`;
      } else if (isHindi) {
        return `मुझे "${attemptedName}" रेस्टोरेंट नहीं मिला। उपलब्ध रेस्टोरेंट हैं: ${list}.`;
      } else {
        return `I couldn't find "${attemptedName}" in Zuno. Available restaurants are: ${list}. Which one would you like to book?`;
      }
    }

    const targetRestaurantName = queryRestaurantName || currentRestaurantName;

    if (targetRestaurantName) {
      const menuItems = [];
      const lines = ctx.split('\n');
      let inMenuSection = false;
      for (const line of lines) {
        if (line.startsWith('Menu:')) {
          inMenuSection = true;
          continue;
        }
        if (inMenuSection) {
          if (line.trim() === '' || line.startsWith('Selected') || line.startsWith('Guests:') || line.startsWith('Ordered')) {
            inMenuSection = false;
            continue;
          }
          const itemMatch = line.match(/-\s*(.*?)\s*\|\s*₹([\d,]+)/);
          if (itemMatch) {
            menuItems.push({
              name: itemMatch[1].trim(),
              price: itemMatch[2].trim()
            });
          }
        }
      }

      const listToUse = menuItems.length > 0 ? menuItems : getFallbackMenu(targetRestaurantName);
      const listStr = listToUse.map(item => `• ${item.name}: ₹${item.price}`).join('\n');

      const isTelugu = /[\u0C00-\u0C7F]/.test(u) || /\b(avunu|kadhu|cheppandi)\b/i.test(u);
      const isHindi = /[\u0900-\u097F]/.test(u) || /\b(haan|nahi|kijiye|suno)\b/i.test(u);

      // If the restaurant is not currently selected, prepend search action
      const requiresSelection = !currentRestaurantName || currentRestaurantName.toLowerCase() !== targetRestaurantName.toLowerCase();
      const actionPrefix = requiresSelection
        ? `{"action":"SEARCH_RESTAURANTS","query":"${targetRestaurantName}"}\n`
        : '';

      if (isTelugu) {
        return `${actionPrefix}${targetRestaurantName} లో లభించే ఆహార పదార్థాలు మరియు వాటి ధరలు ఇక్కడ ఉన్నాయి:\n${listStr}\n\nమీరు ఏమి ఆర్డర్ చేయాలనుకుంటున్నారు?`;
      } else if (isHindi) {
        return `${actionPrefix}${targetRestaurantName} में उपलब्ध आइटम और उनकी कीमतें इस प्रकार हैं:\n${listStr}\n\nआप क्या ऑर्डर करना चाहेंगे?`;
      } else {
        return `${actionPrefix}Here are the items available at ${targetRestaurantName} with their prices:\n${listStr}\n\nWhat would you like to order?`;
      }
    }
  }

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
