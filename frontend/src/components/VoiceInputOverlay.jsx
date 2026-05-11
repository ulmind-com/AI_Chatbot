/**
 * VoiceInputOverlay — ChatGPT-style premium full-screen voice recording UI
 *
 * Features:
 *  • Animated sound-wave / volume ring visualiser
 *  • Live transcript preview with typing effect
 *  • Recording timer
 *  • Language switcher
 *  • Permission / error modals
 *  • Mobile-friendly touch targets
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Languages, Square, AlertCircle } from 'lucide-react';
import { LANGUAGES } from '../hooks/useVoiceInput';

/* ── tiny helper ── */
const cn = (...c) => c.filter(Boolean).join(' ');

/* ─────────────── Audio Wave Bars ─────────────── */
function WaveBars({ volume, isListening }) {
  const BAR_COUNT = 28;
  const bars = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const center = BAR_COUNT / 2;
      const dist = Math.abs(i - center) / center;          // 0 at centre, 1 at edge
      const base = 0.15 + Math.random() * 0.1;
      const volFactor = volume * (1 - dist * 0.6);
      return Math.max(base, volFactor);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, isListening]);

  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="rounded-full w-[3.5px]"
          style={{
            background: `linear-gradient(180deg, #a78bfa ${Math.round(h * 100)}%, #6366f1)`,
          }}
          animate={{
            height: isListening ? `${Math.max(8, h * 64)}px` : '6px',
            opacity: isListening ? 0.7 + h * 0.3 : 0.3,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 18,
            mass: 0.4,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────── Pulse Ring ─────────────── */
function PulseRing({ volume, isListening }) {
  const scale = 1 + volume * 0.35;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 160, height: 160,
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        }}
        animate={{
          scale: isListening ? [scale, scale + 0.15, scale] : 1,
          opacity: isListening ? [0.5, 0.8, 0.5] : 0,
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Inner ring */}
      <motion.div
        className="absolute rounded-full border-2 border-violet-500/40"
        style={{ width: 110, height: 110 }}
        animate={{
          scale: isListening ? [1, 1 + volume * 0.12, 1] : 0.9,
          opacity: isListening ? 0.7 : 0,
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* ─────────────── Language Picker ─────────────── */
function LanguagePicker({ current, onChange, isOpen, setIsOpen }) {
  const langs = Object.entries(LANGUAGES);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full
                   bg-white/5 border border-white/10 text-sm text-gray-300
                   hover:bg-white/10 hover:text-white transition-all"
      >
        <Languages size={14} />
        <span>{LANGUAGES[current]?.flag} {LANGUAGES[current]?.label}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                       bg-[#1e1e22] border border-white/10 rounded-xl
                       shadow-2xl overflow-hidden min-w-[180px] z-50"
          >
            {langs.map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => { onChange(key); setIsOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all',
                  current === key
                    ? 'bg-violet-500/15 text-violet-300'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <span className="text-base">{cfg.flag}</span>
                <span>{cfg.label}</span>
                {current === key && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-violet-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────── Error Display ─────────────── */
function ErrorBanner({ error, onRetry }) {
  const messages = {
    permission: { title: 'Microphone Access Denied', desc: 'Please allow microphone access in your browser settings and try again.' },
    unsupported: { title: 'Browser Not Supported', desc: 'Speech recognition is not available in this browser. Try Chrome, Edge, or Safari.' },
    'no-speech': { title: 'No Speech Detected', desc: 'We couldn\'t hear anything. Please try again and speak clearly.' },
    network: { title: 'Network Error', desc: 'Speech recognition requires an internet connection. Check your connection and try again.' },
  };
  const msg = messages[error] || { title: 'Something went wrong', desc: 'An unexpected error occurred. Please try again.' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col items-center gap-4 text-center max-w-xs"
    >
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20
                      flex items-center justify-center">
        <AlertCircle size={28} className="text-red-400" />
      </div>
      <div>
        <p className="text-white font-semibold text-lg">{msg.title}</p>
        <p className="text-gray-400 text-sm mt-1 leading-relaxed">{msg.desc}</p>
      </div>
      {error !== 'unsupported' && (
        <button
          onClick={onRetry}
          className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500
                     text-white text-sm font-medium transition-all
                     shadow-lg shadow-violet-500/20"
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Main Overlay Component
   ═══════════════════════════════════════════════ */
export default function VoiceInputOverlay({
  isOpen,
  isListening,
  volume,
  interimText,
  transcript,
  formattedTime,
  error,
  language,
  onChangeLanguage,
  onToggle,
  onStop,
  onClose,
  onRetry,
}) {
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const displayText = interimText || transcript;

  // Close language picker if overlay closes
  useEffect(() => { if (!isOpen) setLangPickerOpen(false); }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, rgba(30,20,50,0.97) 0%, rgba(10,10,14,0.98) 100%)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
          }}
        >
          {/* Close button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full
                       bg-white/5 border border-white/10 text-gray-400
                       hover:bg-white/10 hover:text-white
                       flex items-center justify-center transition-all z-10"
          >
            <X size={18} />
          </motion.button>

          {/* ── Error state ── */}
          {error ? (
            <ErrorBanner error={error} onRetry={onRetry} />
          ) : (
            <>
              {/* Pulse Ring + Centre Mic */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative flex items-center justify-center mb-6"
                style={{ width: 200, height: 200 }}
              >
                <PulseRing volume={volume} isListening={isListening} />
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={isListening ? onStop : onToggle}
                  className={cn(
                    'relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all',
                    isListening
                      ? 'bg-red-500/20 border-2 border-red-400/60 shadow-[0_0_40px_rgba(239,68,68,0.25)]'
                      : 'bg-violet-600/30 border-2 border-violet-400/50 shadow-[0_0_40px_rgba(139,92,246,0.3)]'
                  )}
                >
                  {isListening ? (
                    <Square size={24} className="text-red-400" fill="currentColor" />
                  ) : (
                    <Mic size={28} className="text-violet-300" />
                  )}
                </motion.button>
              </motion.div>

              {/* Status label */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-3 mb-5"
              >
                {isListening ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-400" />
                    </span>
                    <span className="text-sm font-medium text-red-300 tracking-wide">Listening…</span>
                    <span className="text-xs text-gray-500 font-mono ml-1">{formattedTime}</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Tap the microphone to start</span>
                )}
              </motion.div>

              {/* Sound wave bars */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <WaveBars volume={volume} isListening={isListening} />
              </motion.div>

              {/* Live transcript */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="w-full max-w-md px-6 mb-10 min-h-[48px]"
              >
                {displayText ? (
                  <p className="text-center text-white/90 text-lg leading-relaxed font-light">
                    "{displayText}"
                    {isListening && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="inline-block w-[2px] h-5 bg-violet-400 ml-1 align-text-bottom"
                      />
                    )}
                  </p>
                ) : (
                  isListening && (
                    <p className="text-center text-gray-500 text-sm italic">
                      Start speaking…
                    </p>
                  )
                )}
              </motion.div>

              {/* Language picker */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <LanguagePicker
                  current={language}
                  onChange={onChangeLanguage}
                  isOpen={langPickerOpen}
                  setIsOpen={setLangPickerOpen}
                />
              </motion.div>
            </>
          )}

          {/* Bottom hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-8 text-xs text-gray-500 text-center"
          >
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 text-[10px]">Esc</kbd> to close  ·  Shortcut <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 text-[10px]">Ctrl+Shift+M</kbd>
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
