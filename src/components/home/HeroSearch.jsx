import { useState, useRef } from 'react';
import { Search, X, MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Pune'];

export default function HeroSearch({ value, onChange, location, onLocationChange }) {
  const [focused, setFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef(null);

  const handleCitySelect = (city) => {
    onLocationChange(city);
    setDropdownOpen(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <motion.div
        animate={{
          boxShadow: focused
            ? '0 0 0 3px rgba(245,158,11,0.3), 0 8px 32px rgba(0,0,0,0.12)'
            : '0 4px 16px rgba(0,0,0,0.08)',
        }}
        transition={{ duration: 0.2 }}
        className="flex items-center bg-white rounded-2xl overflow-visible"
      >
        {/* Custom Location selector on left */}
        <div className="relative flex-shrink-0 h-full">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 pl-4 pr-3.5 border-r border-gray-150 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer select-none rounded-l-2xl max-w-[120px] sm:max-w-[170px] h-full"
          >
            <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-dark-800 truncate select-none">
              {location}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                {/* Backdrop to close on outside click */}
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                
                {/* Dropdown Card */}
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute left-0 top-[calc(100%+8px)] z-50 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1"
                >
                  {CITIES.map((city) => {
                    const isActive = location === city;
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleCitySelect(city)}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-between
                          ${isActive
                            ? 'bg-amber-50 text-amber-600'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <span>{city}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          animate={{ color: focused ? '#F59E0B' : '#9CA3AF' }}
          className="pl-4 pr-2 flex-shrink-0"
        >
          <Search className="w-4.5 h-4.5" />
        </motion.div>
        
        <input
          ref={inputRef}
          type="text"
          placeholder="Search restaurants, cuisines..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 py-4 text-dark-800 placeholder-gray-400 bg-transparent focus:outline-none text-sm sm:text-base min-w-0"
        />

        {value && (
          <button
            onClick={() => { onChange(''); inputRef.current?.focus(); }}
            className="pr-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
