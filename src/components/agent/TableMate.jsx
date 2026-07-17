import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, MicOff, MessageSquare, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';
import { useTableMate, AGENT_STATE } from '../../hooks/useTableMate';

// ── Animated Robot SVG ───────────────────────────────────────────────────────
function RobotFace({ state }) {
  const isListening = state === AGENT_STATE.LISTENING;
  const isThinking = state === AGENT_STATE.THINKING;
  const isSpeaking = state === AGENT_STATE.SPEAKING;
  const isActive = state !== AGENT_STATE.IDLE;

  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Antenna */}
      <motion.line
        x1="40" y1="8" x2="40" y2="18"
        stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round"
        animate={{ y: isThinking ? [0, -3, 0] : 0 }}
        transition={{ repeat: isThinking ? Infinity : 0, duration: 0.6 }}
      />
      <motion.circle
        cx="40" cy="6" r="4"
        fill={isListening ? '#34d399' : isThinking ? '#f59e0b' : isSpeaking ? '#60a5fa' : '#a78bfa'}
        animate={{ 
          y: isThinking ? [0, -3, 0] : 0, 
          scale: isActive ? [1, 1.4, 1] : 1, 
          opacity: isActive ? [1, 0.7, 1] : 1 
        }}
        transition={{
          y: { repeat: isThinking ? Infinity : 0, duration: 0.6 },
          scale: { repeat: isActive ? Infinity : 0, duration: isListening ? 0.7 : 1.2 },
          opacity: { repeat: isActive ? Infinity : 0, duration: isListening ? 0.7 : 1.2 },
        }}
      />

      {/* Head */}
      <motion.rect
        x="14" y="18" width="52" height="44" rx="10"
        fill="url(#headGrad)"
        stroke={isListening ? '#34d399' : isThinking ? '#f59e0b' : '#6d28d9'}
        strokeWidth="2"
        animate={{ scale: isActive ? [1, 1.015, 1] : 1 }}
        transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
      />

      {/* Gradient def */}
      <defs>
        <linearGradient id="headGrad" x1="14" y1="18" x2="66" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#2d1b69" />
        </linearGradient>
      </defs>

      {/* Left Eye */}
      <motion.ellipse
        cx="30" cy="35" rx="7" ry="7"
        fill={isListening ? '#34d399' : isThinking ? '#f59e0b' : isSpeaking ? '#60a5fa' : '#818cf8'}
        animate={{ scaleY: isActive ? [1, 0.15, 1] : 1 }}
        transition={{ repeat: isActive ? Infinity : 0, duration: 3.5, times: [0, 0.1, 0.2] }}
      />
      <motion.circle
        cx="30" cy="35" r="3.5"
        fill="white"
        animate={{ x: isListening ? [0, 1, 0] : 0 }}
        transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
      />

      {/* Right Eye */}
      <motion.ellipse
        cx="50" cy="35" rx="7" ry="7"
        fill={isListening ? '#34d399' : isThinking ? '#f59e0b' : isSpeaking ? '#60a5fa' : '#818cf8'}
        animate={{ scaleY: isActive ? [1, 0.15, 1] : 1 }}
        transition={{ repeat: isActive ? Infinity : 0, duration: 3.5, times: [0, 0.1, 0.2], delay: 0.05 }}
      />
      <motion.circle
        cx="50" cy="35" r="3.5"
        fill="white"
        animate={{ x: isListening ? [0, 1, 0] : 0 }}
        transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
      />

      {/* Mouth */}
      {isSpeaking ? (
        <motion.rect
          key="mouth-speaking"
          x="25" y="50" rx="4"
          width="18"
          height="8"
          fill="#60a5fa"
          animate={{ width: [18, 26, 18, 22, 18], height: [8, 10, 6, 10, 8], x: [25, 22, 25, 23, 25], y: [50, 49, 51, 49, 50] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        />
      ) : isListening ? (
        <motion.path
          key="mouth-listening"
          d="M25 52 Q40 62 55 52"
          stroke="#34d399" strokeWidth="3" strokeLinecap="round" fill="none"
          animate={{ d: ['M25 52 Q40 62 55 52', 'M25 50 Q40 60 55 50', 'M25 52 Q40 62 55 52'] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      ) : (
        <motion.path
          key="mouth-idle"
          d="M27 52 Q40 60 53 52"
          stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" fill="none"
        />
      )}

      {/* Cheek blush */}
      <ellipse cx="20" cy="44" rx="4" ry="2.5" fill="#f472b6" opacity="0.25" />
      <ellipse cx="60" cy="44" rx="4" ry="2.5" fill="#f472b6" opacity="0.25" />

      {/* Neck */}
      <rect x="34" y="62" width="12" height="6" rx="3" fill="#2d1b69" />

      {/* Body/Chest plate */}
      <rect x="20" y="68" width="40" height="10" rx="5" fill="url(#headGrad)" stroke="#6d28d9" strokeWidth="1.5" />
      <circle cx="35" cy="73" r="2.5" fill={isListening ? '#34d399' : '#a78bfa'} opacity="0.8" />
      <circle cx="40" cy="73" r="2.5" fill={isThinking ? '#f59e0b' : '#a78bfa'} opacity="0.8" />
      <circle cx="45" cy="73" r="2.5" fill={isSpeaking ? '#60a5fa' : '#a78bfa'} opacity="0.8" />
    </svg>
  );
}

// ── Waveform animation when listening ────────────────────────────────────────
function Waveform() {
  return (
    <div className="flex items-center justify-center gap-[3px] h-5">
      {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6].map((h, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-emerald-400"
          animate={{ scaleY: [h, 1, h * 0.6, 1, h] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
          style={{ height: '100%', originY: 'center' }}
        />
      ))}
    </div>
  );
}

// ── Single chat message bubble ────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isAgent = msg.role === 'agent';
  const langFlag = { en: '🇬🇧', te: '🇮🇳', hi: '🇮🇳' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isAgent ? 'justify-start' : 'justify-end'} mb-3`}
    >
      {isAgent && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center mr-2 flex-shrink-0 mt-1 text-xs">
          🤖
        </div>
      )}
      <div className={`max-w-[78%] ${isAgent ? 'items-start' : 'items-end'} flex flex-col gap-1`}>
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isAgent
            ? 'bg-gradient-to-br from-[#1e1b4b] to-[#2d1b69] text-gray-100 rounded-tl-sm border border-violet-800/40'
            : 'bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-tr-sm'
        }`}>
          {msg.text}
        </div>
        <span className="text-[10px] text-gray-500 px-1">
          {langFlag[msg.lang] || '🌐'} {msg.timestamp?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

// ── State label ───────────────────────────────────────────────────────────────
function StateLabel({ state }) {
  const labels = {
    [AGENT_STATE.IDLE]: null,
    [AGENT_STATE.GREETING]: { text: 'Starting up...', color: 'text-violet-400' },
    [AGENT_STATE.LISTENING]: { text: 'Listening...', color: 'text-emerald-400' },
    [AGENT_STATE.THINKING]: { text: 'Thinking...', color: 'text-amber-400' },
    [AGENT_STATE.SPEAKING]: { text: 'Speaking...', color: 'text-blue-400' },
    [AGENT_STATE.PAYMENT]: { text: 'Processing payment...', color: 'text-pink-400' },
    [AGENT_STATE.COMPLETE]: { text: 'Booking confirmed! ✅', color: 'text-emerald-400' },
    [AGENT_STATE.ERROR]: { text: 'Error occurred', color: 'text-red-400' },
  };
  const label = labels[state];
  if (!label) return null;
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`text-xs font-medium ${label.color} flex items-center gap-1`}
    >
      {state === AGENT_STATE.THINKING && (
        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block">⚙️</motion.span>
      )}
      {label.text}
    </motion.p>
  );
}

// ── Main TableMate Component ──────────────────────────────────────────────────
export default function TableMate() {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  
  const messagesEndRef = useRef(null);

  // Voice callbacks (declared early so hooks can reference them)
  const handleSpeak = useCallback((text, lang, onDone) => {
    if (isMutedRef.current) {
      onDone?.();
    } else {
      speak(text, lang, () => {
        onDone?.();
        if (isSupported && !isMutedRef.current) {
          startListening(lang);
        }
      });
    }
  }, []); // eslint-disable-line

  const handleStateChange = useCallback((state) => {
    // Auto-start listening after agent speaks (except payment/complete/error)
    // Handled inside sendMessage callback
  }, []);

  const { agentState, messages, lang, error, startConversation, sendMessage, reset } = useTableMate({
    onSpeak: handleSpeak,
    onStateChange: handleStateChange,
  });

  const handleVoiceResult = useCallback((transcript, detectedLang) => {
    sendMessage(transcript, detectedLang);
  }, [sendMessage]);

  const handleVoiceEnd = useCallback(() => {}, []);
  const handleVoiceError = useCallback((err) => {
    console.warn('Voice error:', err);
  }, []);

  const { isListening, isSpeaking, isSupported, startListening, stopListening, speak, stopSpeaking } = useVoice({
    onResult: handleVoiceResult,
    onEnd: handleVoiceEnd,
    onError: handleVoiceError,
  });

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) {
        stopSpeaking();
      }
      return next;
    });
  }, [stopSpeaking]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Open panel → start conversation
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (messages.length === 0) {
      setTimeout(() => startConversation(), 300);
    }
  }, [messages.length, startConversation]);

  // Close panel
  const handleClose = useCallback(() => {
    setIsOpen(false);
    stopSpeaking();
    stopListening();
  }, [stopSpeaking, stopListening]);

  // Mic button
  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      startListening(lang);
    }
  }, [isListening, stopListening, stopSpeaking, startListening, lang]);

  // Text send
  const handleTextSend = useCallback(() => {
    if (!textInput.trim()) return;
    sendMessage(textInput.trim(), lang);
    setTextInput('');
  }, [textInput, sendMessage, lang]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
    }
  }, [handleTextSend]);

  // Determine robot animation state
  const robotState = isListening ? AGENT_STATE.LISTENING
    : isSpeaking ? AGENT_STATE.SPEAKING
    : agentState;

  const isActive = agentState !== AGENT_STATE.IDLE;

  return (
    <>
      {/* ── Floating Robot Button ── */}
      <div className="fixed bottom-12 right-12 z-50 flex flex-col items-end gap-3">

        {/* Tooltip when closed */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ 
                opacity: [1, 0.4, 1],
                scale: [1, 1.03, 1],
                x: 0
              }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              transition={{ 
                opacity: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
                scale: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
                x: { duration: 0.3 }
              }}
              className="bg-[#1e1b4b] text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-700/50 shadow-lg whitespace-nowrap"
            >
              🤖 Book a table by voice
            </motion.div>
          )}
        </AnimatePresence>

        {/* Robot bubble button */}
        <motion.button
          onClick={isOpen ? handleClose : handleOpen}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          animate={isOpen ? {} : {
            y: [0, -6, 0],
            transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }
          }}
          className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#1e1b4b] via-[#2d1b69] to-[#4c1d95] shadow-[0_8px_32px_rgba(109,40,217,0.5)] border-2 border-violet-500/50 overflow-hidden flex items-center justify-center"
        >
          {/* Pulse ring when active */}
          {isActive && !isOpen && (
            <motion.div
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 rounded-full border-2 border-violet-400"
            />
          )}

          {/* Listening green ring */}
          {isListening && (
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="absolute inset-0 rounded-full border-2 border-emerald-400"
            />
          )}

          <div className="w-[56px] h-[56px]">
            <RobotFace state={robotState} />
          </div>

          {/* X overlay when open */}
          {isOpen && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </div>
          )}
        </motion.button>
      </div>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-[128px] right-12 z-50 w-[340px] sm:w-[380px] h-[460px] max-h-[calc(100vh-160px)] rounded-3xl overflow-hidden shadow-2xl border border-violet-800/40 flex flex-col"
            style={{ background: 'linear-gradient(135deg, #0f0c29, #1a1040, #1e1b4b)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-violet-800/40 bg-black/20 flex-shrink-0">
              <div className="w-10 h-10 flex-shrink-0">
                <RobotFace state={robotState} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-heading font-extrabold text-sm">TableMate</h3>
                  <span className="text-[10px] bg-violet-700/60 text-violet-300 px-1.5 py-0.5 rounded-full font-bold">AI</span>
                </div>
                <StateLabel state={isListening ? AGENT_STATE.LISTENING : isSpeaking ? AGENT_STATE.SPEAKING : agentState} />
              </div>
              {/* Waveform when listening */}
              {isListening && (
                <div className="w-16">
                  <Waveform />
                </div>
              )}
              {/* Mute button */}
              <button
                onClick={toggleMute}
                className={`transition-colors flex-shrink-0 p-1.5 rounded-xl ml-auto ${
                  isMuted 
                    ? 'text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                title={isMuted ? "Unmute voice" : "Mute voice"}
              >
                {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
              </button>

              <button
                onClick={() => { reset(); setIsOpen(false); }}
                className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded-xl hover:bg-white/5 flex-shrink-0"
                title="Reset conversation"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-hide">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="w-24 h-24"
                  >
                    <RobotFace state={AGENT_STATE.IDLE} />
                  </motion.div>
                  <p className="text-gray-400 text-sm">Starting TableMate...</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            {!isSupported ? (
              // Text-only fallback when voice not supported
              <div className="px-3 py-2 border-t border-violet-800/40 bg-black/20 flex-shrink-0">
                <p className="text-yellow-400 text-xs text-center mb-2">Voice not supported in this browser. Type below.</p>
                <div className="flex items-center gap-2">
                  <input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/10 text-white placeholder-gray-400 text-sm px-3 py-2 rounded-xl border border-violet-700/40 focus:outline-none focus:border-violet-400 transition-colors"
                  />
                  <button
                    onClick={handleTextSend}
                    disabled={!textInput.trim()}
                    className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center disabled:opacity-40 transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-3 py-3 border-t border-violet-800/40 bg-black/20 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {/* Text input fallback */}
                  <input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? 'Listening...' : 'Or type here...'}
                    disabled={isListening}
                    className="flex-1 bg-white/10 text-white placeholder-gray-400 text-xs px-3 py-2 rounded-xl border border-violet-700/40 focus:outline-none focus:border-violet-400 transition-colors disabled:opacity-50"
                  />

                  {/* Send text button */}
                  {textInput && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={handleTextSend}
                      className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </motion.button>
                  )}

                  {/* Mic button */}
                  <motion.button
                    onClick={handleMicToggle}
                    disabled={agentState === AGENT_STATE.THINKING || agentState === AGENT_STATE.PAYMENT}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    animate={isListening ? { boxShadow: ['0 0 0px #34d399', '0 0 20px #34d399', '0 0 0px #34d399'] } : {}}
                    transition={{ repeat: isListening ? Infinity : 0, duration: 1 }}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40 ${
                      isListening
                        ? 'bg-emerald-500 text-white'
                        : 'bg-violet-600 hover:bg-violet-500 text-white'
                    }`}
                  >
                    {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </motion.button>
                </div>

                {/* Language indicator */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <p className="text-[10px] text-gray-500">
                    {isListening ? '🎙️ Speak in English, Telugu, or Hindi' : '🎤 Tap mic to speak'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
