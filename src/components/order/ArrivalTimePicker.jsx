import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CalendarDays, Zap, CheckCircle2 } from 'lucide-react';
import {
  QUICK_SLOTS,
  EXTENDED_SLOTS,
  getArrivalDate,
  formatTimeShort,
  formatSlotLabel,
} from '../../utils/timeUtils';

// ── Mode toggle button ────────────────────────────────────────
function ModeTab({ icon: Icon, label, sublabel, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 text-left
        ${active
          ? 'border-amber-400 bg-amber-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/40'
        }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
        ${active ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className={`text-sm font-bold leading-none mb-0.5 ${active ? 'text-amber-700' : 'text-dark-800'}`}>
          {label}
        </p>
        <p className="text-xs text-gray-400">{sublabel}</p>
      </div>
      {active && (
        <CheckCircle2 className="w-4 h-4 text-amber-500 ml-auto flex-shrink-0" />
      )}
    </button>
  );
}

// Dynamic slot generator (generates 30-minute intervals for the next 6 hours)
const generateHalfHourSlots = (avgPrepMinutes) => {
  const slots = [];
  const now = new Date();
  
  // Earliest possible prep completion
  const earliest = new Date(now.getTime() + avgPrepMinutes * 60 * 1000);
  
  // Round up to next 30-minute boundary
  const start = new Date(earliest);
  const minutes = start.getMinutes();
  if (minutes > 0 && minutes <= 30) {
    start.setMinutes(30, 0, 0);
  } else {
    start.setHours(start.getHours() + 1, 0, 0, 0);
  }
  
  // Generate 12 half-hour slots
  for (let i = 0; i < 12; i++) {
    const slotTime = new Date(start.getTime() + i * 30 * 60 * 1000);
    const label = slotTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    slots.push({
      label,
      value: slotTime.getTime() // numeric timestamp value
    });
  }
  return slots;
};

// Helper to parse initialTime and initialDate into a Date object
const parseInitialTime = (timeStr, dateStr) => {
  if (!timeStr) return null;
  const now = new Date();
  const target = new Date();

  if (dateStr) {
    const ds = dateStr.toLowerCase();
    if (ds.includes('tomorrow')) {
      target.setDate(now.getDate() + 1);
    } else if (ds.includes('today')) {
      // Keep today
    } else {
      // Try to parse using native Date parser
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        target.setDate(parsedDate.getDate());
        target.setMonth(parsedDate.getMonth());
        target.setFullYear(parsedDate.getFullYear());
      }
    }
  }

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
  return target;
};

export default function ArrivalTimePicker({ avgPrepMinutes = 20, onChange, initialTime, initialDate }) {
  const slots = generateHalfHourSlots(avgPrepMinutes);

  // Match slot based on initialTime/initialDate
  const initialDateObj = parseInitialTime(initialTime, initialDate);
  let matchedMode = 'quick';
  let matchedQuick = '+30';
  let matchedExtended = slots[0]?.value || '';

  if (initialDateObj) {
    const match = slots.find(s => {
      const d = new Date(s.value);
      return d.getHours() === initialDateObj.getHours() && 
             Math.abs(d.getMinutes() - initialDateObj.getMinutes()) < 15 &&
             d.getDate() === initialDateObj.getDate();
    });

    if (match) {
      matchedMode = 'slot';
      matchedExtended = match.value;
    } else {
      // Check if it fits quick slots
      const diffMins = Math.round((initialDateObj.getTime() - Date.now()) / 60000);
      if (diffMins > 0 && diffMins <= 60) {
        matchedMode = 'quick';
        if (diffMins <= 20) matchedQuick = '+15';
        else if (diffMins <= 37) matchedQuick = '+30';
        else if (diffMins <= 52) matchedQuick = '+45';
        else matchedQuick = '+60';
      }
    }
  }

  const [mode, setMode]               = useState(matchedMode);
  const [selectedQuick, setSelectedQuick] = useState(matchedQuick);
  const [selectedExtended, setSelectedExtended] = useState(matchedExtended);
  const [customDate, setCustomDate]   = useState('');
  const [customTime, setCustomTime]   = useState('');

  // Call onChange with initial values once when mounting
  useEffect(() => {
    const initDate = mode === 'quick' ? getArrivalDate(selectedQuick) : getArrivalDate(selectedExtended);
    const initSlot = mode === 'quick' ? selectedQuick : selectedExtended;
    onChange({ arrivalDate: initDate, slot: initSlot });
  }, []);

  /* ── helpers ─────────────────────────────────────────── */
  const buildArrivalFromCustom = (dateStr, timeStr) => {
    if (!timeStr) return null;
    const base = dateStr ? new Date(dateStr) : new Date();
    const [h, m] = timeStr.split(':').map(Number);
    base.setHours(h, m, 0, 0);
    if (!dateStr && base <= new Date()) base.setDate(base.getDate() + 1);
    return base;
  };

  const notifyChange = (arrivalDate, slot) => onChange({ arrivalDate, slot });

  /* ── mode switch ─────────────────────────────────────── */
  const switchMode = (m) => {
    setMode(m);
    if (m === 'quick') {
      notifyChange(getArrivalDate(selectedQuick), selectedQuick);
    } else {
      if (customDate && customTime) {
        const d = buildArrivalFromCustom(customDate, customTime);
        if (d) { notifyChange(d, 'custom'); return; }
      }
      notifyChange(getArrivalDate(selectedExtended), selectedExtended);
    }
  };

  /* ── quick slot select ───────────────────────────────── */
  const handleQuickSelect = (val) => {
    setSelectedQuick(val);
    notifyChange(getArrivalDate(val), val);
  };

  /* ── extended slot select ────────────────────────────── */
  const handleExtendedSelect = (val) => {
    setSelectedExtended(val);
    setCustomDate('');
    setCustomTime('');
    notifyChange(getArrivalDate(val), val);
  };

  /* ── custom date / time ──────────────────────────────── */
  const handleCustomDate = (e) => {
    const val = e.target.value;
    setCustomDate(val);
    const d = buildArrivalFromCustom(val, customTime);
    if (d) notifyChange(d, 'custom');
  };

  const handleCustomTime = (e) => {
    const val = e.target.value;
    setCustomTime(val);
    setSelectedExtended('');
    const d = buildArrivalFromCustom(customDate, val);
    if (d) notifyChange(d, 'custom');
  };

  /* ── derived display value ───────────────────────────── */
  const arrivalDate = (() => {
    if (mode === 'quick') return getArrivalDate(selectedQuick);
    if (customDate && customTime) {
      const d = buildArrivalFromCustom(customDate, customTime);
      if (d) return d;
    }
    if (selectedExtended) return getArrivalDate(selectedExtended);
    return null;
  })();

  // Today's date string for min attribute
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">

      {/* ── Mode toggle ──────────────────────────────────── */}
      <div className="flex gap-3">
        <ModeTab
          icon={Zap}
          label="Arriving Soon"
          sublabel="Within 1 hour"
          active={mode === 'quick'}
          onClick={() => switchMode('quick')}
        />
        <ModeTab
          icon={CalendarDays}
          label="Book a Slot"
          sublabel="Schedule for later"
          active={mode === 'slot'}
          onClick={() => switchMode('slot')}
        />
      </div>

      {/* ── Content pane ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {mode === 'quick' ? (

          /* Quick slots */
          <motion.div
            key="quick"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">How soon will you arrive?</p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_SLOTS.map((slot) => (
                <motion.button
                  key={slot.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickSelect(slot.value)}
                  className={`py-3 rounded-2xl text-sm font-semibold text-center transition-all duration-200
                    ${selectedQuick === slot.value
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                >
                  {slot.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

        ) : (

          /* Slot booking */
          <motion.div
            key="slot"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Extended time options */}
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Select your arrival slot</p>
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => (
                  <motion.button
                    key={slot.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleExtendedSelect(slot.value)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-semibold text-left transition-all duration-200 flex items-center justify-between
                      ${selectedExtended === slot.value && !customTime
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50'
                      }`}
                  >
                    <span>{slot.label}</span>
                    {selectedExtended === slot.value && !customTime && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Or pick exact date & time */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">OR pick exact time</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    min={todayStr}
                    value={customDate}
                    onChange={handleCustomDate}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="time"
                    value={customTime}
                    onChange={handleCustomTime}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Arrival summary card ──────────────────────────── */}
      <AnimatePresence mode="wait">
        {arrivalDate && (
          <motion.div
            key={arrivalDate.toISOString()}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.22 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4"
          >
            <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-200">
              {mode === 'slot' ? (
                <CalendarDays className="w-5 h-5 text-white" />
              ) : (
                <span className="text-xl">🍽️</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-700 font-medium text-xs">
                {mode === 'slot' ? 'Slot booked for' : 'Food ready by'}
              </p>
              <p className="text-amber-900 font-extrabold text-xl font-heading leading-tight">
                {mode === 'slot' ? formatSlotLabel(arrivalDate) : formatTimeShort(arrivalDate)}
              </p>
              <p className="text-amber-600 text-xs mt-0.5">
                Avg. prep time: {avgPrepMinutes} min · Kitchen starts before your arrival
              </p>
            </div>
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
