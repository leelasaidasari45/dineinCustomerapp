// ── useVoice — Web Speech API Hook ──────────────────────────────────────────
// Handles Speech-to-Text (STT) and Text-to-Speech (TTS)
// Supports: English (en-IN), Telugu (te-IN), Hindi (hi-IN)

import { useState, useRef, useCallback, useEffect } from 'react';

const LANG_MAP = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
};

export function useVoice({ onResult, onEnd, onError }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [detectedLang, setDetectedLang] = useState('en');

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const currentUtteranceRef = useRef(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !window.speechSynthesis) {
      setIsSupported(false);
    }
  }, []);

  // Detect language from text
  const detectLanguage = useCallback((text) => {
    // Telugu Unicode range: 0C00–0C7F
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
    // Hindi/Devanagari Unicode range: 0900–097F
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    return 'en';
  }, []);

  // Start listening
  const startListening = useCallback((langHint = 'en') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Stop any ongoing speech first
    synthRef.current?.cancel();
    setIsSpeaking(false);

    // Stop existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    // Try all three languages so user can speak any
    recognition.lang = LANG_MAP[langHint] || 'en-IN';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const lang = detectLanguage(transcript);
      setDetectedLang(lang);
      onResult?.(transcript, lang);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        onError?.(event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      onEnd?.();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn('Recognition start error:', e);
    }
  }, [detectLanguage, onResult, onEnd, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
    setIsListening(false);
  }, []);

  // Speak text aloud
  const speak = useCallback((text, lang = 'en', onDone) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    // Strip JSON action lines before speaking
    const cleanText = text
      .split('\n')
      .filter(line => !line.trim().startsWith('{'))
      .join(' ')
      .replace(/[*_`#]/g, '') // strip markdown
      .trim();

    if (!cleanText) {
      onDone?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = LANG_MAP[lang] || 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    // Try to find a good female voice for the language
    const voices = synthRef.current.getVoices();
    const langCode = LANG_MAP[lang]?.split('-')[0] || 'en';
    const langVoices = voices.filter(v => v.lang.startsWith(langCode));

    // List of known female voices or keywords in order of preference
    const femaleKeywords = ['sulafat', 'zira', 'samantha', 'hazel', 'susan', 'karen', 'tessa', 'moira', 'veena', 'female', 'woman'];
    
    let preferred = null;

    // 1. Try to find a female voice in the matching language
    for (const keyword of femaleKeywords) {
      preferred = langVoices.find(v => v.name.toLowerCase().includes(keyword));
      if (preferred) break;
    }

    // 2. If no female voice is found in that language, try to find any female voice globally
    if (!preferred) {
      for (const keyword of femaleKeywords) {
        preferred = voices.find(v => v.name.toLowerCase().includes(keyword));
        if (preferred) break;
      }
    }

    // 3. Fallback: Google/Microsoft female-sounding defaults
    if (!preferred) {
      preferred = langVoices.find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('microsoft'));
    }

    // 4. Ultimate fallback: first available local service voice
    if (!preferred) {
      preferred = langVoices.find(v => v.localService) || langVoices[0] || voices[0];
    }

    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      onDone?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onDone?.();
    };

    currentUtteranceRef.current = utterance;
    // Workaround for Chrome bug where speech doesn't start
    setTimeout(() => synthRef.current?.speak(utterance), 100);
    setIsSpeaking(true);
  }, []);

  // Stop speech
  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch (_) {}
      synthRef.current?.cancel();
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    detectedLang,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
