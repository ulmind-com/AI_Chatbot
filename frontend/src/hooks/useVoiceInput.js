/**
 * useVoiceInput — ChatGPT-style Speech-to-Text hook
 * 
 * Uses the Web Speech API (SpeechRecognition) for real-time
 * transcription with silence auto-stop, multi-language support,
 * and full error handling.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

/* ── Supported languages ── */
const LANGUAGES = {
  en: { code: 'en-US', label: 'English', flag: '🇺🇸' },
  hi: { code: 'hi-IN', label: 'हिन्दी',  flag: '🇮🇳' },
  bn: { code: 'bn-IN', label: 'বাংলা',   flag: '🇧🇩' },
  ar: { code: 'ar-SA', label: 'العربية',  flag: '🇸🇦' },
  es: { code: 'es-ES', label: 'Español',  flag: '🇪🇸' },
};

export { LANGUAGES };

export default function useVoiceInput({
  onTranscript,          // (text: string) => void — called with final text
  onInterimTranscript,   // (text: string) => void — called with live partial text
  language = 'en',       // language key from LANGUAGES
  silenceTimeout = 2500, // ms of silence before auto-stop
  autoSend = false,      // auto-call onTranscript on stop
} = {}) {
  const [isListening, setIsListening]   = useState(false);
  const [isSupported, setIsSupported]   = useState(true);
  const [error, setError]               = useState(null);   // 'permission' | 'unsupported' | 'no-speech' | 'network' | null
  const [transcript, setTranscript]     = useState('');
  const [interimText, setInterimText]   = useState('');
  const [elapsed, setElapsed]           = useState(0);      // recording seconds
  const [volume, setVolume]             = useState(0);       // 0-1 audio level for visualiser

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const audioCtxRef     = useRef(null);
  const analyserRef     = useRef(null);
  const animFrameRef    = useRef(null);
  const mediaStreamRef  = useRef(null);
  const accumulatedRef  = useRef('');   // accumulates final results across onresult events
  const manualStopRef   = useRef(false);

  /* ── Check browser support on mount ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setIsSupported(false);
      setError('unsupported');
    }
  }, []);

  /* ── Audio visualiser: get mic volume ── */
  const startAudioVisualiser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        // average volume normalised to 0-1
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVolume(Math.min(avg / 128, 1));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Non-critical — visualiser is optional
    }
  }, []);

  const stopAudioVisualiser = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current)  audioCtxRef.current.close().catch(() => {});
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    audioCtxRef.current  = null;
    analyserRef.current  = null;
    mediaStreamRef.current = null;
    setVolume(0);
  }, []);

  /* ── Elapsed timer ── */
  const startElapsedTimer = useCallback(() => {
    setElapsed(0);
    elapsedTimerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  }, []);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
  }, []);

  /* ── Reset silence timer ── */
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      // Auto-stop after silence
      stopListening();
    }, silenceTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [silenceTimeout]);

  /* ── Stop ── */
  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    stopElapsedTimer();
    stopAudioVisualiser();
    setIsListening(false);
    setInterimText('');

    const finalText = accumulatedRef.current.trim();
    if (finalText) {
      setTranscript(finalText);
      if (onTranscript) onTranscript(finalText);
    }
  }, [stopElapsedTimer, stopAudioVisualiser, onTranscript]);

  /* ── Start ── */
  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimText('');
    accumulatedRef.current = '';
    manualStopRef.current = false;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('unsupported');
      return;
    }

    const recognition = new SR();
    const langConfig = LANGUAGES[language] || LANGUAGES.en;
    recognition.lang            = langConfig.code;
    recognition.interimResults  = true;
    recognition.continuous      = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      startElapsedTimer();
      startAudioVisualiser();
      resetSilenceTimer();
    };

    recognition.onresult = (event) => {
      resetSilenceTimer();
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalChunk) {
        accumulatedRef.current += finalChunk;
        setTranscript(accumulatedRef.current);
        if (onTranscript) onTranscript(accumulatedRef.current);
      }
      setInterimText(interim);
      if (onInterimTranscript) onInterimTranscript(accumulatedRef.current + interim);
    };

    recognition.onerror = (event) => {
      switch (event.error) {
        case 'not-allowed':
          setError('permission');
          break;
        case 'no-speech':
          setError('no-speech');
          break;
        case 'network':
          setError('network');
          break;
        case 'aborted':
          // User-initiated — not an error
          break;
        default:
          setError(event.error);
      }
      // Don't stop here — onend will handle cleanup
    };

    recognition.onend = () => {
      // If we didn't manually stop and it ended (e.g. silence, or browser auto-stopped),
      // restart automatically for continuous mode UNLESS there was an error.
      if (!manualStopRef.current && !error) {
        // The browser sometimes stops recognition after silence.
        // We auto-restart it for a seamless experience.
        try {
          recognition.start();
          return;
        } catch {
          // Fall through to cleanup
        }
      }

      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopElapsedTimer();
      stopAudioVisualiser();

      const finalText = accumulatedRef.current.trim();
      if (finalText && autoSend && onTranscript) {
        onTranscript(finalText);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      setError('unknown');
      setIsListening(false);
    }
  }, [language, startElapsedTimer, startAudioVisualiser, resetSilenceTimer,
      stopElapsedTimer, stopAudioVisualiser, onTranscript, onInterimTranscript,
      autoSend, error]);

  /* ── Toggle ── */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) try { recognitionRef.current.abort(); } catch {}
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopElapsedTimer();
      stopAudioVisualiser();
    };
  }, [stopElapsedTimer, stopAudioVisualiser]);

  /* ── Format elapsed time mm:ss ── */
  const formattedTime = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return {
    isListening,
    isSupported,
    error,
    transcript,
    interimText,
    volume,          // 0-1 for visualiser
    elapsed,
    formattedTime,
    startListening,
    stopListening,
    toggleListening,
    setError,
  };
}
