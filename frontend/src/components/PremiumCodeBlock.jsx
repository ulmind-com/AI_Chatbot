import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Copy, Check, Download, Maximize2, Minimize2, 
  WrapText, Terminal, ChevronDown, ChevronUp 
} from 'lucide-react';

export default function PremiumCodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-${language || 'snippet'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <>
      {/* Fullscreen backdrop */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm"
            onClick={() => setIsFullscreen(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`relative group my-6 rounded-xl overflow-hidden shadow-2xl transition-all duration-300
          border border-[#ffffff15] hover:border-[#8b5cf650]
          ${isFullscreen ? 'fixed inset-4 sm:inset-12 z-[100] flex flex-col' : 'w-full'}
        `}
        style={{
          background: 'linear-gradient(145deg, #121214 0%, #0d0d0f 100%)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.05)',
        }}
      >
        {/* Subtle animated border glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
             style={{ background: 'radial-gradient(1200px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), rgba(139, 92, 246, 0.12), transparent 40%)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1e]/90 backdrop-blur-md border-b border-[#ffffff10] sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#ff5f56]/20"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#ffbd2e]/20"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#27c93f]/20"></div>
            </div>
            <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
            <Terminal size={14} className="text-violet-400" />
            <span className="font-mono text-xs font-semibold text-gray-300 uppercase tracking-wider">
              {language || 'Code'}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
            <button onClick={() => setIsWrapped(!isWrapped)} title="Toggle Word Wrap"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <WrapText size={14} className={isWrapped ? 'text-violet-400' : ''} />
            </button>
            
            <button onClick={() => setIsCollapsed(!isCollapsed)} title="Toggle Collapse"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            <button onClick={handleDownload} title="Download Code"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <Download size={14} />
            </button>

            <button onClick={() => setIsFullscreen(!isFullscreen)} title="Fullscreen"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors hidden sm:block">
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button onClick={handleCopy} title="Copy Code"
              className={`flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-md transition-all active:scale-95 border
                ${copied 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-300'
                }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span className="text-xs font-medium">
                {copied ? 'Copied' : 'Copy'}
              </span>
            </button>
          </div>
        </div>

        {/* Code Body */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative bg-[#0d0d0f] ${isFullscreen ? 'flex-1 overflow-auto' : ''}`}
            >
              {/* Custom CSS overrides for Prism to ensure JetBrains Mono font and clean scrollbars */}
              <style>{`
                .premium-code-block pre {
                  margin: 0 !important;
                  border-radius: 0 !important;
                  background: transparent !important;
                }
                .premium-code-block code {
                  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace !important;
                  font-variant-ligatures: contextual !important;
                }
                .premium-code-block .linenumber {
                  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace !important;
                  color: #4b4b53 !important;
                  min-width: 2.5em !important;
                  padding-right: 1.2em !important;
                  text-align: right !important;
                }
                .premium-code-block::-webkit-scrollbar {
                  width: 10px;
                  height: 10px;
                }
                .premium-code-block::-webkit-scrollbar-track {
                  background: transparent;
                }
                .premium-code-block::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 10px;
                  border: 2px solid #0d0d0f;
                }
                .premium-code-block::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.2);
                }
              `}</style>
              
              <SyntaxHighlighter
                language={language || 'javascript'}
                style={vscDarkPlus}
                showLineNumbers={true}
                wrapLines={true}
                wrapLongLines={isWrapped}
                className="premium-code-block"
                customStyle={{
                  padding: '1.25rem 0',
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: '1.65',
                  maxHeight: isFullscreen ? 'none' : '500px',
                  overflowX: 'auto',
                }}
              >
                {code}
              </SyntaxHighlighter>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
