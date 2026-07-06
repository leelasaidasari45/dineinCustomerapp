import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSecondsDiff, formatCountdown } from '../../utils/timeUtils';

function AnimatedDigit({ digit }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={digit}
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="inline-block"
      >
        {digit}
      </motion.span>
    </AnimatePresence>
  );
}

export default function CountdownTimer({ targetTime, label = 'Time until arrival' }) {
  const [seconds, setSeconds] = useState(() => getSecondsDiff(new Date(targetTime)));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getSecondsDiff(new Date(targetTime));
      setSeconds(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const formatted = formatCountdown(seconds);
  const digits = formatted.split('');

  if (seconds <= 0) {
    return (
      <div className="text-center">
        <p className="text-gray-500 text-sm mb-1">{label}</p>
        <p className="text-2xl font-heading font-bold text-green-500">Time's up! 🎉</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-gray-500 text-sm mb-2">{label}</p>
      <div className="font-heading font-bold text-4xl text-dark-800 flex items-center justify-center">
        {digits.map((d, i) => (
          d === ':' ? (
            <span key={`sep-${i}`} className="mx-0.5 text-amber-500">:</span>
          ) : (
            <AnimatedDigit key={`d-${i}`} digit={d} />
          )
        ))}
      </div>
    </div>
  );
}
