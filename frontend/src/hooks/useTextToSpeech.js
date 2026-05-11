/**
 * useTextToSpeech — Premium AI voice output using Web Speech Synthesis API
 *
 * Features:
 *  • Speaks AI responses aloud
 *  • Strips markdown/code for clean speech
 *  • Pause / resume / stop controls
 *  • Multiple voice selection
 *  • Rate & pitch control
 *  • Speaking progress tracking
 */
import { useState, useRef, useCallback, useEffect } from 'react';

/* ── Strip markdown & code blocks for cleaner speech ── */
function cleanTextForSpeech(text) {
  return text
    .replace(/```[\s\S]*?```/g, '... code block omitted ...')  // code blocks
    .replace(/`([^`]+)`/g, '$1')                                // inline code
    .replace(/#{1,6}\s/g, '')                                   // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1')                          // bold
    .replace(/\*([^*]+)\*/g, '$1')                              // italic
    .replace(/__([^_]+)__/g, '$1')                              // bold alt
    .replace(/_([^_]+)_/g, '$1')                                // italic alt
    .replace(/~~([^~]+)~~/g, '$1')                              // strikethrough
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')                    // links
    .replace(/!\[[^\]]*\]\([^)]+\)/g, 'image')                  // images
    .replace(/^\s*[-*+]\s/gm, '')                               // list markers
    .replace(/^\s*\d+\.\s/gm, '')                               // ordered list
    .replace(/^\s*>\s/gm, '')                                   // blockquotes
    .replace(/\|[^|]*\|/g, '')                                  // tables
    .replace(/---+/g, '')                                       // horizontal rules
    .replace(/\n{3,}/g, '\n\n')                                 // excessive newlines
    .trim();
}

export default function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isPaused, setIsPaused]       = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef(null);
  const textRef = useRef('');

  useEffect(() => {
    if (!window.speechSynthesis) {
      setIsSupported(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const speak = useCallback((text, { rate = 1.05, pitch = 1.0, lang = 'en-US' } = {}) => {
    if (!window.speechSynthesis || !text?.trim()) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned.trim()) return;

    textRef.current = cleaned;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate  = rate;
    utterance.pitch = pitch;
    utterance.lang  = lang;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith(lang.split('-')[0]) && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Premium'))
    ) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
    utterance.onend   = () => { setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null; };
    utterance.onerror = () => { setIsSpeaking(false); setIsPaused(false); utteranceRef.current = null; };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Preload voices (Chrome loads async)
  useEffect(() => {
    const loadVoices = () => window.speechSynthesis?.getVoices();
    loadVoices();
    window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', loadVoices);
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
  };
}
