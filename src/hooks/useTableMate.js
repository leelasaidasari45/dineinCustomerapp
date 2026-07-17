import { useState, useCallback, useRef } from 'react';
import { askTableMate, parseResponse } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { createOrder } from './useOrders';

// Helper to parse relative and absolute date/time strings into a Date object
function parseArrivalDateTime(dateStr, timeStr) {
  const now = new Date();
  let target = new Date();

  // Parse Date (Default: today)
  if (dateStr) {
    const ds = dateStr.toLowerCase();
    if (ds.includes('tomorrow')) {
      target.setDate(now.getDate() + 1);
    } else if (ds.includes('today')) {
      // Keep today's date
    } else {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const foundDay = days.findIndex(d => ds.includes(d));
      if (foundDay !== -1) {
        const currentDay = now.getDay();
        let diff = foundDay - currentDay;
        if (diff <= 0) diff += 7; // Next week
        target.setDate(now.getDate() + diff);
      }
    }
  }

  // Parse Time (Default: 1 hour from now)
  if (timeStr) {
    const ts = timeStr.toLowerCase();
    const match = ts.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2] || '0');
      const ampm = match[3];

      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;

      target.setHours(hours, minutes, 0, 0);
    }
  } else {
    target.setHours(now.getHours() + 1, 0, 0, 0);
  }

  return target;
}

function findBestMenuItem(menuList, itemName) {
  if (!menuList || menuList.length === 0) return null;
  const target = itemName.toLowerCase().replace(/[^a-z0-9]/g, '');
  let bestMatch = menuList.find(m => m.name.toLowerCase().replace(/[^a-z0-9]/g, '') === target);
  if (bestMatch) return bestMatch;
  bestMatch = menuList.find(m => {
    const mClean = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return mClean.includes(target) || target.includes(mClean);
  });
  if (bestMatch) return bestMatch;
  let maxOverlap = 0;
  let bestOverlapItem = null;
  const targetWords = itemName.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(w => w.length >= 3);
  for (const item of menuList) {
    const itemWords = item.name.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(w => w.length >= 3);
    let overlap = 0;
    for (const tw of targetWords) {
      if (itemWords.includes(tw)) {
        overlap += 1;
      }
    }
    if (overlap > maxOverlap) {
      maxOverlap = overlap;
      bestOverlapItem = item;
    }
  }
  if (bestOverlapItem && maxOverlap > 0) return bestOverlapItem;
  return menuList[0];
}

export const AGENT_STATE = {
  IDLE: 'idle',
  GREETING: 'greeting',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  PAYMENT: 'payment',
  COMPLETE: 'complete',
  ERROR: 'error',
};

const GREETING = {
  en: "Hi! I'm TableMate, your Zuno voice concierge. Which restaurant would you like to visit today?",
  te: "నమస్కారం! నేను TableMate. మీరు ఏ రెస్టారెంట్‌కు వెళ్ళాలనుకుంటున్నారు?",
  hi: "नमस्ते! मैं TableMate हूं। आप किस रेस्टोरेंट में जाना चाहेंगे?",
};

const EMPTY_BOOKING = {
  restaurant: null,
  date: null,
  time: null,
  guests: null,
  items: [],
  specialInstructions: '',
  total: 0,
  advance: 0,
  awaitingQtyFor: null,
  foodConfirmed: false,
  awaitingFoodConfirmation: false,
  menuRequested: false,
};

export function useTableMate({ onSpeak, onStateChange }) {
  const [agentState, setAgentStateRaw] = useState(AGENT_STATE.IDLE);
  const [messages, setMessages] = useState([]);
  // bookingData as state for UI rendering
  const [bookingData, setBookingData] = useState(EMPTY_BOOKING);
  const [lang, setLang] = useState('en');
  const [error, setError] = useState(null);

  // ── REFS (always current, no stale closures) ──────────────────────────────
  // bookingRef mirrors bookingData state but is always current in callbacks
  const bookingRef = useRef({ ...EMPTY_BOOKING });
  const historyRef = useRef([]);
  const restaurantCacheRef = useRef([]);
  const menuCacheRef = useRef({});
  const langRef = useRef('en');

  const setAgentState = useCallback((s) => {
    setAgentStateRaw(s);
    onStateChange?.(s);
  }, [onStateChange]);

  // Sync ref + state together
  const updateBooking = useCallback((updater) => {
    const next = typeof updater === 'function' ? updater(bookingRef.current) : updater;
    bookingRef.current = next;
    setBookingData(next);
  }, []);

  // ── Add message ──
  const addMessage = useCallback((role, text, msgLang) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role,
      text,
      lang: msgLang || langRef.current,
      timestamp: new Date(),
    }]);
  }, []);

  // ── Build context string for AI (reads from REF, always fresh) ──
  const buildContext = useCallback(() => {
    const bd = bookingRef.current;
    const parts = [];

    if (restaurantCacheRef.current.length > 0) {
      parts.push(`Available Restaurants:\n${restaurantCacheRef.current.map(r =>
        `- ID: ${r.id} | Name: ${r.name} | City: ${r.address || ''} | Rating: ${r.rating}`
      ).join('\n')}`);
    }

    if (bd.restaurant) {
      parts.push(`Selected Restaurant: ${bd.restaurant.name} (ID: ${bd.restaurant.id})`);
      const menu = menuCacheRef.current[bd.restaurant.id];
      if (menu?.length > 0) {
        parts.push(`Menu:\n${menu.map(m =>
          `- ${m.name} | ₹${m.price} | Cat: ${m.category || 'Main'}`
        ).join('\n')}`);
      }
    }

    if (bd.date)   parts.push(`Selected Date: ${bd.date}`);
    if (bd.time)   parts.push(`Selected Time: ${bd.time}`);
    if (bd.guests) parts.push(`Guests: ${bd.guests}`);
    if (bd.items?.length > 0) {
      parts.push(`Ordered Items:\n${bd.items.map(i =>
        `- ${i.name} ×${i.qty} | ₹${(i.price || 300) * i.qty}`
      ).join('\n')}`);
    }
    if (bd.total > 0) {
      parts.push(`Total: ₹${bd.total} | Advance (50%): ₹${bd.advance}`);
    }

    return parts.join('\n\n');
  }, []);

  // ── Fetch restaurants ──
  const fetchRestaurants = useCallback(async () => {
    if (restaurantCacheRef.current.length > 0) return; // already loaded
    try {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false });
      restaurantCacheRef.current = data || [];
    } catch (_) {}
  }, []);

  // ── Fetch menu ──
  const fetchMenu = useCallback(async (restaurantId) => {
    if (menuCacheRef.current[restaurantId]) return menuCacheRef.current[restaurantId];

    // Fallback menu for mock/dynamic restaurants
    if (String(restaurantId).startsWith('mock-')) {
      const mockMenu = [
        { id: 'menu-idly', name: 'Idly', price: 100, is_veg: true },
        { id: 'menu-dosa', name: 'Dosa', price: 120, is_veg: true },
        { id: 'menu-biryani', name: 'Biryani', price: 250, is_veg: false },
        { id: 'menu-burger', name: 'Burger', price: 150, is_veg: false },
      ];
      menuCacheRef.current[restaurantId] = mockMenu;
      return mockMenu;
    }

    try {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId);
      menuCacheRef.current[restaurantId] = data || [];
      return data || [];
    } catch (_) { return []; }
  }, []);

// Fuzzy matching helper for restaurant names (handles silent letters like 'h' in Shadhab, double letters, spaces, etc.)
function fuzzyMatch(userQuery, restaurantName) {
  const q = userQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
  const r = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (q === r) return true;
  if (q.includes(r)) return true;
  if (q.length >= 3 && r.includes(q)) return true;

  // Prefix match (only for queries at least 3 characters long to prevent matches on short greetings like 'hi')
  if (q.length >= 3 && r.startsWith(q)) return true;

  // Soundex-like stripping for common Indian spellings (e.g. Shadhab vs Shadab)
  const stripH = s => s.replace(/h/g, '');
  if (stripH(q) === stripH(r)) return true;

  // Double character reduction (e.g. Paradise vs Paradice)
  const reduceDouble = s => s.replace(/(.)\1/g, '$1');
  if (reduceDouble(q) === reduceDouble(r)) return true;

  return false;
}

// ── Handle actions from AI response ──
  const handleActions = useCallback(async (actions) => {
    for (const action of actions) {

      // Restaurant search
      if (action.action === 'SEARCH_RESTAURANTS') {
        await fetchRestaurants();
        const query = (action.query || '').trim();
        // Find best match using fuzzy match
        let match = restaurantCacheRef.current.find(r =>
          fuzzyMatch(query, r.name) ||
          fuzzyMatch(query.split(' ')[0], r.name)
        );

        // Fallback 1: Match against dashboard/mock restaurant list
        if (!match) {
          const MOCK_LIST = [
            { id: 'mock-1', name: 'Spice Garden', address: 'Bangalore' },
            { id: 'mock-2', name: 'The Pizza Republic', address: 'Bangalore' },
            { id: 'mock-3', name: 'Wok & Roll', address: 'Bangalore' },
            { id: 'mock-4', name: 'South Spice', address: 'Bangalore' },
            { id: 'mock-5', name: 'Burger Barn', address: 'Hyderabad' },
            { id: 'mock-6', name: 'Sweet Cravings', address: 'Hyderabad' },
            { id: 'mock-sai', name: 'Sri Sai Balaji Restaurant', address: 'Hyderabad' },
          ];
          match = MOCK_LIST.find(r =>
            fuzzyMatch(query, r.name) ||
            fuzzyMatch(query.split(' ')[0], r.name)
          );
        }

        if (match) {
          updateBooking(prev => ({ ...prev, restaurant: match }));
          await fetchMenu(match.id);
        } else {
          // Reset restaurant to null if not found
          updateBooking(prev => ({ ...prev, restaurant: null }));
        }
      }

      // Get menu
      if (action.action === 'GET_MENU' && action.restaurantId) {
        await fetchMenu(action.restaurantId);
      }

      // Open payment
      if (action.action === 'OPEN_PAYMENT') {
        const advance = Number(action.advance) || bookingRef.current.advance;
        const total   = Number(action.total)   || bookingRef.current.total;
        updateBooking(prev => ({ ...prev, advance, total }));
        setAgentState(AGENT_STATE.PAYMENT);
        triggerPayment(advance, total);
      }
    }
  }, [fetchRestaurants, fetchMenu, updateBooking, setAgentState]); // eslint-disable-line

  // ── Payment handler ──
  const triggerPayment = useCallback(async (advance, total) => {
    const currentLang = langRef.current;
    const restaurant = bookingRef.current.restaurant;

    // Use Razorpay if available, otherwise simulate
    if (window.Razorpay) {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_placeholder',
        amount: advance * 100,
        currency: 'INR',
        name: 'Zuno',
        description: `Table Booking — ${restaurant?.name || 'Restaurant'}`,
        handler: (response) => onPaymentSuccess(advance, total, currentLang, response?.razorpay_payment_id || 'voice_pay_ref'),
        modal: { ondismiss: () => setAgentState(AGENT_STATE.LISTENING) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      // Simulate success in dev
      onPaymentSuccess(advance, total, currentLang, 'simulated_ref_123');
    }
  }, [setAgentState]); // eslint-disable-line

  const onPaymentSuccess = useCallback(async (advance, total, currentLang, paymentRefCode) => {
    const bd = bookingRef.current;
    setAgentState(AGENT_STATE.THINKING);

    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error("User session not found.");

      // Ensure we have menu items mapped to DB records
      let menu = menuCacheRef.current[bd.restaurant.id] || [];
      if (menu.length === 0) {
        menu = await fetchMenu(bd.restaurant.id);
      }

      const cartItems = bd.items.map(item => {
        // Match user requested item to closest DB menu item
        const match = findBestMenuItem(menu, item.name) || menu[0]; // default fallback
        
        return {
          menuItem: match,
          quantity: item.qty || 1,
          notes: bd.specialInstructions || null
        };
      });

      // Parse arrival and estimated ready times
      const arrivalTime = parseArrivalDateTime(bd.date, bd.time);
      const estimatedReadyTime = new Date(arrivalTime.getTime() - 15 * 60 * 1000); // 15 mins before

      // ── Create Order in Supabase DB ──
      const order = await createOrder({
        customerId: currentUser.id,
        restaurantId: bd.restaurant.id,
        cartItems,
        arrivalTime,
        estimatedReadyTime,
        totalAmount: total,
        advancePaidAmount: advance,
        remainingAmount: total - advance,
        paymentReference: paymentRefCode,
      });

      const confirmText = {
        en: `Your booking is confirmed! 🎉\nRestaurant: ${bd.restaurant?.name}\nArrival: ${bd.date} at ${bd.time}\nGuests: ${bd.guests}\nAdvance paid: ₹${advance}\n\nI'm opening the tracking page for you now. Enjoy your meal!`,
        te: `మీ బుకింగ్ నిర్ధారించబడింది! 🎉\nరెస్టారెంట్: ${bd.restaurant?.name}\nసమయం: ${bd.date} ${bd.time}కి\nఅడ్వాన్స్ చెల్లించారు: ₹${advance}\n\nట్రాకింగ్ పేజీని ఓపెన్ చేస్తున్నాను!`,
        hi: `आपकी बुकिंग कन्फर्म! 🎉\nरेस्टोरेंट: ${bd.restaurant?.name}\nआगमन: ${bd.date} को ${bd.time}\nएडवांस: ₹${advance}\n\nट्रैकिंग पेज खोला जा रहा है!`,
      };
      const txt = confirmText[currentLang] || confirmText.en;
      addMessage('agent', txt, currentLang);
      onSpeak?.(txt, currentLang);
      setAgentState(AGENT_STATE.COMPLETE);

      // Auto redirect to order success/tracking page in 2.5 seconds
      setTimeout(() => {
        window.location.href = `/track/${order.id}`;
      }, 2500);

    } catch (err) {
      console.error('Failed to create DB order:', err);
      const failTxt = "Your payment succeeded but we had trouble inserting the booking. Please contact support.";
      addMessage('agent', failTxt, currentLang);
      onSpeak?.(failTxt, currentLang);
      setAgentState(AGENT_STATE.ERROR);
    }
  }, [addMessage, onSpeak, setAgentState, fetchMenu]);

  // ── Extract fields from user text and AI response ──
  const extractFields = useCallback((userText, agentText) => {
    const u = userText.toLowerCase();

    updateBooking(prev => {
      const next = { ...prev };

      // Check if user is asking for items/menu list instead of ordering
      const isMenuReq = /\b(menu|items|dishes|food|list|card|available|serve|serves|have|present)\b/i.test(u) &&
                        !/\b(order|add|want\s+to\s+order|want\s+to\s+add)\b/i.test(u);
      
      if (isMenuReq) {
        next.menuRequested = true;
        // Search if a restaurant name is mentioned in this query to select it
        let found = restaurantCacheRef.current.find(r => {
          const first = r.name.split(' ')[0].toLowerCase();
          const isStopWord = ['the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'at'].includes(first);
          return fuzzyMatch(u, r.name) ||
                 (!isStopWord && first.length >= 3 && fuzzyMatch(u, first));
        });
        if (found) {
          next.restaurant = found;
          fetchMenu(found.id);
        }
      } else {
        next.menuRequested = false;
      }

      // Handle awaitingFoodConfirmation responses
      if (prev.awaitingFoodConfirmation) {
        const isThatIt = /\b(that's it|thats it|nothing else|no\b|nope\b|that is all|that's all|its enough|enough)\b/i.test(u);
        const isAddMore = /\b(add more|want to add|yes\b|yeah\b|yep\b|more\b)\b/i.test(u);
        
        if (isThatIt) {
          next.foodConfirmed = true;
          next.awaitingFoodConfirmation = false;
        } else if (isAddMore) {
          // If they want to add more, transition to need_item to prompt them
          next.awaitingFoodConfirmation = 'need_item';
        }
      }

      // If we were waiting for quantity of a specific item, extract it first
      if (prev.awaitingQtyFor) {
        const numWords = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
        const numMatch = u.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
        if (numMatch) {
          const val = numMatch[1].toLowerCase();
          const qtyVal = numWords[val] || parseInt(val) || 1;
          
          next.items = prev.items.map(item => 
            item.name === prev.awaitingQtyFor ? { ...item, qty: qtyVal } : item
          );
          next.awaitingQtyFor = null;
        }
      }

      // Restaurant: if AI confirmed with SEARCH_RESTAURANTS action — already handled
      // But also try direct mention
      let attemptedName = null;
      const visitMatch = u.match(/(?:visit|book|go to|restaurant|table at|named|hotel)\s+([a-z0-9\s]+)/i);
      if (visitMatch) {
        const candidate = visitMatch[1].replace(/\b(today|tomorrow|at|time|guests?|people|food|order|idly|dosa|biryani|burger|table|tables|seat|seats|spot|spots|booking|reservation|place|places|for|to|a|an|the)\b/g, '').trim();
        // Ignore if candidate looks like a time (e.g. 7pm, 5:00), a number, or a day name
        const isTimeOrDay = /^\d{1,2}\s*(am|pm)?$/i.test(candidate) || 
                            /^\d+$/i.test(candidate) ||
                            /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(candidate);

        if (candidate.length > 2 && !isTimeOrDay) {
          attemptedName = candidate;
        }
      }

      if (attemptedName) {
        let found = restaurantCacheRef.current.find(r => {
          const first = r.name.split(' ')[0].toLowerCase();
          const isStopWord = ['the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'at'].includes(first);
          return fuzzyMatch(attemptedName, r.name) ||
                 (!isStopWord && first.length >= 3 && fuzzyMatch(attemptedName, first));
        });

        if (!found) {
          const MOCK_LIST = [
            { id: 'mock-1', name: 'Spice Garden', address: 'Bangalore' },
            { id: 'mock-2', name: 'The Pizza Republic', address: 'Bangalore' },
            { id: 'mock-3', name: 'Wok & Roll', address: 'Bangalore' },
            { id: 'mock-4', name: 'South Spice', address: 'Bangalore' },
            { id: 'mock-5', name: 'Burger Barn', address: 'Hyderabad' },
            { id: 'mock-6', name: 'Sweet Cravings', address: 'Hyderabad' },
            { id: 'mock-sai', name: 'Sri Sai Balaji Restaurant', address: 'Hyderabad' },
          ];
          found = MOCK_LIST.find(r => {
            const first = r.name.split(' ')[0].toLowerCase();
            const isStopWord = ['the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'at'].includes(first);
            return fuzzyMatch(attemptedName, r.name) ||
                   (!isStopWord && first.length >= 3 && fuzzyMatch(attemptedName, first));
          });
        }

        if (found) {
          next.restaurant = found;
          fetchMenu(found.id);
          next.restaurantError = null;
          if (!prev.restaurant || prev.restaurant.id !== found.id) {
            next.items = []; // Clear previous restaurant's items
          }
        } else {
          next.restaurant = null;
          next.items = []; // Clear items since restaurant is invalid
          next.restaurantError = attemptedName; // Flag invalid name
        }
      } else if (!prev.restaurant) {
        // Direct search fallback
        let found = restaurantCacheRef.current.find(r => {
          const first = r.name.split(' ')[0].toLowerCase();
          const isStopWord = ['the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'at'].includes(first);
          return fuzzyMatch(u, r.name) ||
                 (!isStopWord && first.length >= 3 && fuzzyMatch(u, first));
        });

        if (!found) {
          const MOCK_LIST = [
            { id: 'mock-1', name: 'Spice Garden', address: 'Bangalore' },
            { id: 'mock-2', name: 'The Pizza Republic', address: 'Bangalore' },
            { id: 'mock-3', name: 'Wok & Roll', address: 'Bangalore' },
            { id: 'mock-4', name: 'South Spice', address: 'Bangalore' },
            { id: 'mock-5', name: 'Burger Barn', address: 'Hyderabad' },
            { id: 'mock-6', name: 'Sweet Cravings', address: 'Hyderabad' },
            { id: 'mock-sai', name: 'Sri Sai Balaji Restaurant', address: 'Hyderabad' },
          ];
          found = MOCK_LIST.find(r => {
            const first = r.name.split(' ')[0].toLowerCase();
            const isStopWord = ['the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'at'].includes(first);
            return fuzzyMatch(u, r.name) ||
                   (!isStopWord && first.length >= 3 && fuzzyMatch(u, first));
          });
        }

        if (found) {
          next.restaurant = found;
          fetchMenu(found.id);
          if (!prev.restaurant || prev.restaurant.id !== found.id) {
            next.items = []; // Clear items from previous restaurant
          }
        }
      }

      // Time
      if (!prev.time) {
        if (/\blunch\b/.test(u)) next.time = '1:00 PM';
        else if (/\bdinner\b/.test(u)) next.time = '7:30 PM';
        else if (/\bbreakfast\b/.test(u)) next.time = '9:00 AM';
        else {
          const tm = u.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
          if (tm) {
            const h = tm[1], m = tm[2] || '00';
            const ap = tm[3].toUpperCase();
            next.time = `${h}:${m} ${ap}`;
          } else {
            // 5:00 p.m. style
            const tm2 = u.match(/\b(\d{1,2})(?::(\d{2}))?\s*p\.m\./);
            if (tm2) next.time = `${tm2[1]}:${tm2[2] || '00'} PM`;
            const tm3 = u.match(/\b(\d{1,2})(?::(\d{2}))?\s*a\.m\./);
            if (tm3) next.time = `${tm3[1]}:${tm3[2] || '00'} AM`;
          }
        }
      }

      // Date (extracted with typo tolerance, or defaults to today if a time is set)
      if (!prev.date) {
        if (/\bt[oa]day\b|\btday\b/.test(u)) {
          next.date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
        } else if (/\btomorrow\b/.test(u)) {
          const t = new Date(); t.setDate(t.getDate() + 1);
          next.date = t.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
        } else {
          const dm = u.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
          if (dm) {
            next.date = dm[1].charAt(0).toUpperCase() + dm[1].slice(1);
          } else if (next.time || prev.time) {
            // Auto default to today if time is specified but date is omitted
            next.date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
          }
        }
      }

      // Guests
      if (!prev.guests) {
        const wordNums = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
        const gm = u.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:people|persons?|guests?|of us|pax)?/);
        if (gm) next.guests = wordNums[gm[1]] || parseInt(gm[1]) || null;
      }

      // Food items — look for food-like words or verbs
      const foodNouns = ['biryani', 'idli', 'idly', 'dosa', 'pizza', 'burger', 'curry', 'rice', 'roti', 'naan', 'chicken', 'paneer', 'fish', 'salad', 'kebab', 'kabab', 'coffee', 'tea'];
      const activeRestaurantId = next.restaurant?.id || prev.restaurant?.id;
      const menuItems = activeRestaurantId ? (menuCacheRef.current[activeRestaurantId] || []) : [];
      
      const hasMenuWord = menuItems.some(m => {
        const itemWords = m.name.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(w => w.length >= 3 && !['special', 'steamed', 'fresh', 'warm', 'with', 'ghee', 'spicy'].includes(w));
        return itemWords.some(iw => u.includes(iw));
      });

      const hasFoodNoun = foodNouns.some(n => u.includes(n)) || hasMenuWord;
      const hasFoodVerb = /\b(order|add|eat|want\s+to\s+order|like\s+to\s+order|want\s+to\s+add|like\s+to\s+add)\b/i.test(u);
      
      const hasFood = !next.menuRequested && (hasFoodNoun || (hasFoodVerb && !/\b(visit|book|go\s+to|table|seat|spot|booking|reservation)\b/i.test(u)));

      if (hasFood) {
        
        let matchedItems = [];
        if (menuItems.length > 0) {
          const genericWords = ['special', 'steamed', 'fresh', 'warm', 'with', 'ghee', 'spicy', 'plates', 'portions', 'order', 'want', 'like', 'give', 'add'];
          const userWords = u.split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(w => w.length >= 3 && !genericWords.includes(w));
          
          const scored = menuItems.map(m => {
            const itemWords = m.name.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(w => w.length >= 3 && !genericWords.includes(w));
            let score = 0;
            for (const uw of userWords) {
              for (const iw of itemWords) {
                if (uw === iw) {
                  score += 10;
                } else if (uw.length >= 4 && iw.startsWith(uw)) {
                  score += 5;
                } else if (iw.length >= 4 && uw.startsWith(iw)) {
                  score += 5;
                }
              }
            }
            return { item: m, score };
          });

          const candidates = scored.filter(s => s.score > 0);
          if (candidates.length > 0) {
            const maxScore = Math.max(...candidates.map(c => c.score));
            matchedItems = candidates.filter(c => c.score === maxScore).map(c => c.item);
          }
        }

        if (matchedItems.length > 0) {
          const newItemsParsed = matchedItems.map(m => {
            const wordNums = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
            // Support optional filler words like 'portions of', 'plates of', etc. between quantity and item name
            const beforeRegex = new RegExp(`(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)\\s*(?:portions?|plates?|cups?|glasses?|pieces?|pcs?|orders?|items?)?\\s*(?:of)?\\s*${m.name.toLowerCase()}`);
            const afterRegex = new RegExp(`${m.name.toLowerCase()}\\s+(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)\\s*(?:portions?|plates?|cups?|glasses?|pieces?|pcs?|orders?|items?)?`);
            const qtyMatch = u.match(beforeRegex) || u.match(afterRegex);
            
            let qty = null;
            if (qtyMatch) {
              const val = qtyMatch[1];
              qty = wordNums[val] || parseInt(val) || 1;
            }
            return { name: m.name, qty, price: m.price, menuItem: m };
          });

          // Copy from next.items (which holds updates from awaitingQtyFor block) instead of prev.items
          const currentItems = next.items || prev.items || [];
          if (currentItems.length > 0) {
            const updatedItems = [...currentItems];
            for (const ni of newItemsParsed) {
              const existsIdx = updatedItems.findIndex(item => item.name === ni.name);
              if (existsIdx !== -1) {
                if (ni.qty !== null) {
                  updatedItems[existsIdx].qty = ni.qty;
                }
              } else {
                updatedItems.push(ni);
              }
            }
            next.items = updatedItems;
          } else {
            next.items = newItemsParsed;
          }
          next.itemError = null;
          // Clear confirmation flags so we prompt them again for anything else
          next.foodConfirmed = false;
          next.awaitingFoodConfirmation = false;
        } else if ((next.restaurant || prev.restaurant) && !next.items?.length) {
          const nounMatch = foodNouns.find(n => u.includes(n));
          const verbMatch = u.match(/(?:order|add|give|have|want|like)\s+(?!to\s+)([a-z0-9]+)/i);
          const attemptedFood = nounMatch || verbMatch?.[1];

          next.items = [];
          if (attemptedFood && attemptedFood !== 'table') {
            next.itemError = attemptedFood.charAt(0).toUpperCase() + attemptedFood.slice(1);
          } else {
            next.itemError = "this item";
          }
        }
      }

      // Total from agent response
      const totalM = agentText.match(/Total[:\s]+₹([\d,]+)/i);
      if (totalM) {
        const total = parseInt(totalM[1].replace(',', ''));
        next.total = total;
        next.advance = Math.round(total * 0.5);
      }

      return next;
    });
  }, [updateBooking, fetchMenu]);

  // ── Main: send a message ──
  const sendMessage = useCallback(async (userText, userLang) => {
    if (!userText.trim()) return;

    const currentLang = userLang || langRef.current;
    langRef.current = currentLang;
    setLang(currentLang);

    // Check if user is logged in
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      const loginReq = {
        en: "To book a table, please log in first. I've opened the login window for you.",
        te: "బుకింగ్ చేయడానికి, దయచేసి ముందుగా లాగిన్ అవ్వండి. లాగిన్ విండోను ఓपेన్ చేశాను.",
        hi: "बुकिंग करने के लिए कृपया पहले लॉग इन करें। मैंने लॉग इन विंडो खोल दी है।"
      };
      const txt = loginReq[currentLang] || loginReq.en;
      addMessage('agent', txt, currentLang);
      onSpeak?.(txt, currentLang);
      setAgentState(AGENT_STATE.IDLE);
      useAuthStore.getState().openAuthModal();
      return;
    }

    addMessage('user', userText, currentLang);
    setAgentState(AGENT_STATE.THINKING);

    // Push to Gemini history
    historyRef.current.push({ role: 'user', parts: [{ text: userText }] });

    // Extract fields from user message FIRST (synchronously updates ref)
    extractFields(userText, '');

    // Synchronize menu cache if a restaurant was newly selected
    let bd = bookingRef.current;
    if (bd.restaurant && !menuCacheRef.current[bd.restaurant.id]) {
      await fetchMenu(bd.restaurant.id);
      // Re-extract fields now that the menu cache is populated!
      extractFields(userText, '');
      bd = bookingRef.current; // refresh local reference
    }

    // Check if the user attempted to select an invalid restaurant
    if (bd.restaurantError) {
      const errorMsg = {
        en: `I couldn't find "${bd.restaurantError}" in Zuno. Available restaurants are: Shadhab, Sri Sai Balaji Restaurant. Which one would you like to book?`,
        te: `నేను "${bd.restaurantError}" రెస్టారెంట్‌ను కనుగొనలేకపోయాను. అందుబాటులో ఉన్నవి: Shadhab, Sri Sai Balaji Restaurant.`,
        hi: `मुझे "${bd.restaurantError}" रेस्टोरेंट नहीं मिला। उपलब्ध रेस्टोरेंट हैं: Shadhab, Sri Sai Balaji Restaurant.`
      };
      const txt = errorMsg[currentLang] || errorMsg.en;
      
      // Clear the error flag so it doesn't trigger again
      updateBooking(prev => ({ ...prev, restaurantError: null }));
      
      addMessage('agent', txt, currentLang);
      setAgentState(AGENT_STATE.SPEAKING);
      onSpeak?.(txt, currentLang, () => {
        setAgentState(AGENT_STATE.LISTENING);
      });
      return;
    }

    // Check if the user ordered an item not available at this restaurant
    if (bd.itemError) {
      const errorMsg = {
        en: `Sorry, ${bd.itemError} is not available at ${bd.restaurant?.name || 'this restaurant'}. Would you like to order something else?`,
        te: `క్షమించండి, ${bd.restaurant?.name || 'ఈ రెస్టారెంట్'} లో ${bd.itemError} అందుబాటులో లేదు. మరేదైనా ఆర్డర్ చేస్తారా?`,
        hi: `माफ़ करें, ${bd.restaurant?.name || 'इस रेस्टोरेंट'} में ${bd.itemError} उपलब्ध नहीं है। क्या आप कुछ और ऑर्डर करना चाहेंगे?`
      };
      const txt = errorMsg[currentLang] || errorMsg.en;
      
      // Clear the error flag so it doesn't trigger again
      updateBooking(prev => ({ ...prev, itemError: null }));
      
      addMessage('agent', txt, currentLang);
      setAgentState(AGENT_STATE.SPEAKING);
      onSpeak?.(txt, currentLang, () => {
        setAgentState(AGENT_STATE.LISTENING);
      });
      return;
    }

    // Check if any food item is missing quantity
    const itemMissingQty = bd.items?.find(item => item.qty === null);
    if (itemMissingQty) {
      const errorMsg = {
        en: `How many portions of ${itemMissingQty.name} would you like to order?`,
        te: `${itemMissingQty.name} ఎన్ని కావాలో చెప్పండి?`,
        hi: `आप ${itemMissingQty.name} की कितनी मात्रा ऑर्डर करना चाहेंगे?`
      };
      const txt = errorMsg[currentLang] || errorMsg.en;
      
      // Set the flag to track this item's quantity on next turn
      updateBooking(prev => ({ ...prev, awaitingQtyFor: itemMissingQty.name }));
      
      addMessage('agent', txt, currentLang);
      setAgentState(AGENT_STATE.SPEAKING);
      onSpeak?.(txt, currentLang, () => {
        setAgentState(AGENT_STATE.LISTENING);
      });
      return;
    }

    // Check if we are waiting for a food name after "I want to add more"
    if (bd.awaitingFoodConfirmation === 'need_item') {
      const errorMsg = {
        en: "Okay, tell me what you want to add.",
        te: "సరే, మీరు ఏమి యాడ్ చేయాలనుకుంటున్నారో చెప్పండి.",
        hi: "ठीक है, मुझे बताएं कि आप क्या जोड़ना चाहते हैं।"
      };
      const txt = errorMsg[currentLang] || errorMsg.en;
      
      addMessage('agent', txt, currentLang);
      setAgentState(AGENT_STATE.SPEAKING);
      onSpeak?.(txt, currentLang, () => {
        setAgentState(AGENT_STATE.LISTENING);
      });
      return;
    }

    const hasAllQtys = bd.items?.length > 0 && bd.items.every(item => item.qty !== null);

    // Ask if there is anything else to add before continuing
    if (hasAllQtys && !bd.foodConfirmed) {
      const errorMsg = {
        en: `Anything else you want to add, or that's it?`,
        te: `ఇంకేమైనా యాడ్ చేయాలా, లేక ఇంతేనా?`,
        hi: `कुछ और जोड़ना चाहते हैं, या बस इतना ही?`
      };
      const txt = errorMsg[currentLang] || errorMsg.en;
      
      // Set flag to track confirmation next turn
      updateBooking(prev => ({ ...prev, awaitingFoodConfirmation: true }));
      
      addMessage('agent', txt, currentLang);
      setAgentState(AGENT_STATE.SPEAKING);
      onSpeak?.(txt, currentLang, () => {
        setAgentState(AGENT_STATE.LISTENING);
      });
      return;
    }

    if (bd.restaurant && hasAllQtys && bd.foodConfirmed && bd.date && bd.time) {
      const cartStore = useCartStore.getState();
      cartStore.clearCart();

      // Ensure we have menu items mapped
      let menu = menuCacheRef.current[bd.restaurant.id] || [];
      if (menu.length === 0) {
        menu = await fetchMenu(bd.restaurant.id);
      }

      for (const item of bd.items) {
        const match = findBestMenuItem(menu, item.name) || menu[0];

        if (match) {
          // Set restaurantId and restaurantName on first item insertion
          cartStore.addItem(match, item.qty || 1, bd.specialInstructions || '');
        }
      }

      const redirectText = {
        en: `Perfect! I've added ${bd.items.map(i => i.name).join(', ')} from ${bd.restaurant.name} to your cart. Opening the checkout page now so you can make the 50% advance payment.`,
        te: `సరే! నేను ${bd.restaurant.name} నుండి ${bd.items.map(i => i.name).join(', ')} ని మీ కార్ట్‌కి యాడ్ చేసాను. పేమెంట్ కోసం చెకౌట్ పేజీని ఓపెన్ చేస్తున్నాను.`,
        hi: `ठीक है! मैंने ${bd.restaurant.name} से ${bd.items.map(i => i.name).join(', ')} आपके कार्ट में जोड़ दिया है। भुगतान के लिए चेकआउट पेज खोला जा रहा है।`
      };

      const txt = redirectText[currentLang] || redirectText.en;
      addMessage('agent', txt, currentLang);
      setAgentState(AGENT_STATE.SPEAKING);
      onSpeak?.(txt, currentLang, () => {
        setAgentState(AGENT_STATE.IDLE);
        const timeParam = bd.time ? `&time=${encodeURIComponent(bd.time)}` : '';
        const dateParam = bd.date ? `&date=${encodeURIComponent(bd.date)}` : '';
        window.location.href = `/checkout?redirect=true${timeParam}${dateParam}`;
      });
      return;
    }

    try {
      // Build context from ref (always fresh after extractFields)
      const context = buildContext();
      const rawResponse = await askTableMate(historyRef.current, context);
      const { spokenText, actions } = parseResponse(rawResponse);

      // Handle actions (may update bookingRef)
      await handleActions(actions);

      // Extract fields from agent response too
      extractFields(userText, rawResponse);

      // Push to history
      historyRef.current.push({ role: 'model', parts: [{ text: rawResponse }] });
      if (historyRef.current.length > 40) {
        historyRef.current = historyRef.current.slice(-40);
      }

      if (spokenText) {
        addMessage('agent', spokenText, currentLang);
        setAgentState(AGENT_STATE.SPEAKING);
        onSpeak?.(spokenText, currentLang, () => {
          setAgentState(AGENT_STATE.LISTENING);
        });
      } else {
        setAgentState(AGENT_STATE.LISTENING);
      }

    } catch (err) {
      console.error('TableMate error:', err);
      setError(err.message);
      const errMsg = { en: "Sorry, I had a hiccup. Please try again.", te: "క్షమించండి, మళ్ళీ ప్రయత్నించండి.", hi: "माफ़ करें, फिर से कोशिश करें।" };
      const txt = errMsg[currentLang] || errMsg.en;
      addMessage('agent', txt, currentLang);
      onSpeak?.(txt, currentLang);
      setAgentState(AGENT_STATE.LISTENING);
    }
  }, [addMessage, setAgentState, extractFields, buildContext, handleActions, onSpeak]);

  // ── Start conversation ──
  const startConversation = useCallback(async () => {
    setMessages([]);
    historyRef.current = [];
    bookingRef.current = { ...EMPTY_BOOKING };
    setBookingData({ ...EMPTY_BOOKING });
    setError(null);
    await fetchRestaurants();

    const currentLang = langRef.current;
    setAgentState(AGENT_STATE.GREETING);
    const greeting = GREETING[currentLang] || GREETING.en;
    addMessage('agent', greeting, currentLang);
    onSpeak?.(greeting, currentLang, () => setAgentState(AGENT_STATE.LISTENING));
  }, [fetchRestaurants, addMessage, onSpeak, setAgentState]);

  // ── Reset ──
  const reset = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
    bookingRef.current = { ...EMPTY_BOOKING };
    setBookingData({ ...EMPTY_BOOKING });
    setAgentState(AGENT_STATE.IDLE);
    setError(null);
  }, [setAgentState]);

  return {
    agentState,
    messages,
    bookingData,
    lang,
    error,
    startConversation,
    sendMessage,
    reset,
  };
}
