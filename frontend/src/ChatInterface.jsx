import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { EscalationModal, LiveChatWindow, FloatingSupportButton } from './components/LiveAgent/index.js';
import useHandoverHook from './components/LiveAgent/useHandover.js';
import SearchResultsCard from './components/SearchResultsCard.jsx';
import useVoiceInput from './hooks/useVoiceInput.js';
import VoiceInputOverlay from './components/VoiceInputOverlay.jsx';
import useTextToSpeech from './hooks/useTextToSpeech.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Copy, Check, Code2, Play, Sparkles, Settings, Terminal,
  ArrowUp, Paperclip, Mic, MicOff, Globe, Pencil, Lightbulb, ChevronDown,
  ThumbsUp, ThumbsDown, Plus, AudioLines, MessageSquare, PanelLeftClose, PanelLeft, Search, MoreHorizontal, Trash2
} from 'lucide-react';

/* ─────────────────────────── helpers ─────────────────────────── */
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

import PremiumCodeBlock from './components/PremiumCodeBlock.jsx';

/* ─────────────────────────── Code block ─────────────────────────── */
function CodeBlock({ inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  if (!inline && match) {
    return (
      <PremiumCodeBlock 
        language={match[1]} 
        code={String(children).replace(/\n$/, '')} 
      />
    );
  }
  return (
    <code className="bg-[#2a2a2a] border border-[#3f3f3f] rounded px-1.5 py-0.5 text-sm font-mono text-[#e8b4ff]" {...props}>
      {children}
    </code>
  );
}

/* ─────────────────────────── Typing indicator ─────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
          style={{ animationDelay: `${i * 120}ms`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────── Collapsed Icon Rail ─────────────────────────── */
function CollapsedRail({ onOpen, conversations, activeId, onSelect, onNewChat }) {
  const recent = conversations.slice(0, 5);

  const railBtn = (onClick, title, icon) => (
    <button
      key={title}
      onClick={onClick}
      title={title}
      style={{
        width: '40px', height: '40px', borderRadius: '10px', border: 'none',
        background: 'transparent', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#6b7280', transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e5e7eb'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
    >
      {icon}
    </button>
  );

  return (
    <div style={{
      width: '56px', minWidth: '56px', height: '100vh', flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: '#212121',
      borderRight: '1px solid rgba(255,255,255,0.04)',
      padding: '12px 0', zIndex: 40,
    }}>
      <button
        onClick={onOpen} title="Open sidebar"
        style={{
          width: '36px', height: '36px', borderRadius: '50%', border: 'none',
          background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', marginBottom: '6px',
          boxShadow: '0 0 12px rgba(139,92,246,0.35)',
          transition: 'box-shadow 0.15s, transform 0.15s', flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.55)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 12px rgba(139,92,246,0.35)'; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <Sparkles style={{ width: '16px', height: '16px', color: '#fff' }} />
      </button>
      <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.07)', margin: '6px 0 8px' }} />
      {railBtn(onNewChat, 'New chat', <Plus style={{ width: '18px', height: '18px' }} />)}
      {railBtn(null, 'Search chats', <Search style={{ width: '17px', height: '17px' }} />)}
      <div style={{ width: '28px', height: '1px', background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, overflowY: 'hidden' }}>
        {recent.map(conv => (
          <button
            key={conv.id}
            title={conv.title}
            onClick={() => onSelect(conv.id)}
            style={{
              width: '34px', height: '34px', borderRadius: '8px', border: 'none',
              background: activeId === conv.id ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: activeId === conv.id ? '#c4b5fd' : '#9ca3af',
              transition: 'background 0.15s, color 0.15s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.18)'; e.currentTarget.style.color = '#c4b5fd'; }}
            onMouseLeave={e => { e.currentTarget.style.background = activeId === conv.id ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = activeId === conv.id ? '#c4b5fd' : '#9ca3af'; }}
          >
            <MessageSquare style={{ width: '15px', height: '15px' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Sidebar ─────────────────────────── */
function Sidebar({ isOpen, toggleSidebar, conversations, activeId, onSelect, onNewChat }) {
  const [searchVal, setSearchVal] = useState('');

  const groups = ['Today', 'Yesterday', 'Older'];
  const filtered = conversations.filter(h => h.title.toLowerCase().includes(searchVal.toLowerCase()));

  /* Collapsed state → show icon rail */
  if (!isOpen) {
    return <CollapsedRail onOpen={toggleSidebar} conversations={conversations} activeId={activeId} onSelect={onSelect} onNewChat={onNewChat} />;
  }

  return (
    <div
      style={{
        width: '268px', minWidth: '268px',
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: '#212121',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0, zIndex: 40, position: 'relative',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Subtle top glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '120px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ── HEADER ── */}
      <div style={{ padding: '14px 12px 10px', flexShrink: 0 }}>
        {/* ULMIND AI + New Chat */}
        <button
          onClick={onNewChat}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '10px 12px', borderRadius: '12px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            transition: 'background 0.15s ease', marginBottom: '8px',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(139,92,246,0.4)', flexShrink: 0,
            }}>
              <Sparkles style={{ width: '15px', height: '15px', color: '#fff' }} />
            </div>
            <span style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 600, letterSpacing: '-0.01em' }}>ULMIND AI</span>
          </div>
          <div style={{
            width: '26px', height: '26px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.07)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Plus style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
          </div>
        </button>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search style={{
            width: '14px', height: '14px', position: 'absolute',
            left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280',
          }} />
          <input
            type="text"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Search conversations…"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px', padding: '8px 12px 8px 32px',
              color: '#e5e7eb', fontSize: '13px', outline: 'none',
              transition: 'border-color 0.15s', boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
          />
        </div>
      </div>

      {/* ── CHAT HISTORY ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px', scrollbarWidth: 'none' }}>
        {groups.map(group => {
          const items = filtered.filter(h => h.date === group);
          if (!items.length) return null;
          return (
            <div key={group} style={{ marginBottom: '4px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: '#4b5563',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '14px 8px 6px',
              }}>
                {group}
              </div>
              {items.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => onSelect(chat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 10px', borderRadius: '10px', cursor: 'pointer',
                    marginBottom: '2px', transition: 'all 0.15s ease',
                    background: activeId === chat.id ? 'rgba(139,92,246,0.13)' : 'transparent',
                    border: activeId === chat.id ? '1px solid rgba(139,92,246,0.25)' : '1px solid transparent',
                    position: 'relative',
                  }}
                  className="sidebar-chat-item"
                  onMouseEnter={e => {
                    if (activeId !== chat.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.querySelector('.more-btn').style.opacity = '1';
                  }}
                  onMouseLeave={e => {
                    if (activeId !== chat.id) e.currentTarget.style.background = 'transparent';
                    e.currentTarget.querySelector('.more-btn').style.opacity = '0';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                    <MessageSquare style={{ width: '14px', height: '14px', color: activeId === chat.id ? '#a78bfa' : '#6b7280', flexShrink: 0 }} />
                    <span style={{
                      fontSize: '13px', color: activeId === chat.id ? '#e5e7eb' : '#9ca3af',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontWeight: activeId === chat.id ? 500 : 400,
                    }}>
                      {chat.title}
                    </span>
                  </div>
                  <div
                    className="more-btn"
                    style={{
                      opacity: 0, transition: 'opacity 0.15s', flexShrink: 0, marginLeft: '6px',
                      width: '24px', height: '24px', borderRadius: '6px',
                      background: 'rgba(255,255,255,0.08)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreHorizontal style={{ width: '13px', height: '13px', color: '#9ca3af' }} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        padding: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0,
      }}>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
            padding: '10px 12px', borderRadius: '12px', border: 'none',
            background: 'transparent', cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #374151, #1f2937)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Settings style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
          </div>
          <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Settings</span>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Topbar toggle button ─────────────────────────── */
function SidebarToggle({ onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      title={isOpen ? 'Close sidebar' : 'Open sidebar'}
      style={{
        width: '34px', height: '34px', borderRadius: '10px', border: 'none',
        background: 'transparent', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#6b7280', transition: 'background 0.15s, color 0.15s', flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e5e7eb'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
    >
      {isOpen ? <PanelLeftClose style={{ width: '18px', height: '18px' }} /> : <PanelLeft style={{ width: '18px', height: '18px' }} />}
    </button>
  );
}

/* ─────────────────────────── Input Box ─────────────────────────── */
function InputBox({ onSend, placeholder = 'Message Nova…', editPromptText, clearEditPrompt, voiceTriggeredRef }) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [webSearchOn, setWebSearchOn] = useState(false);
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingAutoSendRef = useRef(false);

  /* ── Voice Input Hook ── */
  const voice = useVoiceInput({
    language: voiceLang,
    silenceTimeout: 2500,
    onTranscript: (text) => {
      setValue(text);
      pendingAutoSendRef.current = true;
      setTimeout(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'; } }, 0);
    },
    onInterimTranscript: (text) => {
      setValue(text);
      setTimeout(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'; } }, 0);
    },
  });

  /* Auto-send when voice stops and we have a final transcript */
  useEffect(() => {
    if (!voice.isListening && pendingAutoSendRef.current && value.trim()) {
      pendingAutoSendRef.current = false;
      if (voiceTriggeredRef) voiceTriggeredRef.current = true;
      setVoiceOverlayOpen(false);
      setTimeout(() => {
        onSend(value.trim(), [], webSearchOn);
        setValue('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.isListening]);

  const handleMicClick = () => {
    if (voice.isListening) {
      voice.stopListening();
      setVoiceOverlayOpen(false);
    } else {
      setVoiceOverlayOpen(true);
      voice.startListening();
    }
  };

  const handleVoiceClose = () => {
    if (voice.isListening) voice.stopListening();
    setVoiceOverlayOpen(false);
    voice.setError(null);
  };

  const handleVoiceRetry = () => {
    voice.setError(null);
    voice.startListening();
  };

  /* Keyboard shortcut: Ctrl+Shift+M */
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') { e.preventDefault(); handleMicClick(); }
      if (e.key === 'Escape' && voiceOverlayOpen) { handleVoiceClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceOverlayOpen, voice.isListening]);

  useEffect(() => {
    if (editPromptText) {
      setValue(editPromptText);
      if (textareaRef.current) { textareaRef.current.focus(); setTimeout(adjust, 0); }
      clearEditPrompt();
    }
  }, [editPromptText, clearEditPrompt]);

  const adjust = () => { const el = textareaRef.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px'; };
  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, { file, preview: file.type.startsWith('image/') ? reader.result : null, base64: reader.result.split(',')[1], type: file.type, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (index) => { setAttachments(prev => prev.filter((_, i) => i !== index)); };

  const submit = () => {
    if (voice.isListening) { voice.stopListening(); setVoiceOverlayOpen(false); }
    const text = value.trim();
    if (!text && attachments.length === 0) return;
    onSend(text, attachments, webSearchOn);
    setValue('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const canSend = value.trim().length > 0 || attachments.length > 0;

  return (
    <>
    <VoiceInputOverlay
      isOpen={voiceOverlayOpen}
      isListening={voice.isListening}
      volume={voice.volume}
      interimText={voice.interimText}
      transcript={voice.transcript}
      formattedTime={voice.formattedTime}
      error={voice.error}
      language={voiceLang}
      onChangeLanguage={setVoiceLang}
      onToggle={handleMicClick}
      onStop={() => { voice.stopListening(); setVoiceOverlayOpen(false); }}
      onClose={handleVoiceClose}
      onRetry={handleVoiceRetry}
    />
    <div style={{
      width: '100%', position: 'relative',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '20px',
      border: webSearchOn ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.1)',
      boxShadow: webSearchOn
        ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1) inset, 0 0 20px rgba(99,102,241,0.06)'
        : '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.08) inset',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      transition: 'all 0.25s ease',
    }} className="input-box-wrap">
      <style>{`
        .input-box-wrap:focus-within { border-color: rgba(139,92,246,0.4) !important; box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.2) inset, 0 0 24px rgba(139,92,246,0.08) !important; }
        .input-icon-btn:hover { background: rgba(255,255,255,0.1) !important; color: #e5e7eb !important; }
        .send-btn-active { background: linear-gradient(135deg, #a78bfa, #6366f1) !important; box-shadow: 0 0 20px rgba(139,92,246,0.5) !important; }
        .send-btn-active:hover { transform: scale(1.08) !important; }
        .send-btn-idle:hover { background: rgba(255,255,255,0.12) !important; }
        .web-search-toggle-on  { background: rgba(99,102,241,0.18) !important; color: #a5b4fc !important; border-color: rgba(99,102,241,0.35) !important; }
        .web-search-toggle-off { background: transparent !important; color: #6b7280 !important; border-color: transparent !important; }
        .web-search-toggle-on:hover  { background: rgba(99,102,241,0.28) !important; }
        .web-search-toggle-off:hover { background: rgba(255,255,255,0.07) !important; color: #9ca3af !important; }
        @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
      `}</style>

      {/* Web search active indicator strip */}
      {webSearchOn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px 0' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', animation: 'webPulse 2s ease-in-out infinite', flexShrink: 0 }} />
          <style>{`@keyframes webPulse{0%,100%{opacity:1;box-shadow:0 0 4px #818cf8}50%{opacity:0.5;box-shadow:0 0 8px #818cf8}}`}</style>
          <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 500, letterSpacing: '0.02em' }}>Web Search Active — results will be fetched before responding</span>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', padding: '14px 14px 0', flexWrap: 'wrap' }}>
          {attachments.map((att, i) => (
            <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {att.preview ? (
                <img src={att.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', padding: '4px' }}>📄<br/><span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block'}}>{att.name}</span></div>
              )}
              <button onClick={() => removeAttachment(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Textarea row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', padding: '14px 14px 10px' }}>
        <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*,application/pdf" />
        <button className="input-icon-btn" onClick={() => fileInputRef.current?.click()} style={{ width: '34px', height: '34px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', transition: 'background 0.15s, color 0.15s', flexShrink: 0, marginRight: '8px', marginBottom: '2px' }}>
          <Plus style={{ width: '18px', height: '18px' }} />
        </button>
        <textarea ref={textareaRef} value={value} onChange={(e) => { setValue(e.target.value); adjust(); }} onKeyDown={handleKey} placeholder={webSearchOn ? 'Ask anything — web search active…' : 'Ask anything…'} rows={1} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f3f4f6', fontSize: '15px', lineHeight: '1.6', resize: 'none', overflow: 'hidden', minHeight: '26px', maxHeight: '180px', fontFamily: 'inherit', letterSpacing: '-0.01em' }} />
      </div>

      {/* Bottom toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 12px' }}>
        {/* Left tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="input-icon-btn"
            title={voice.isListening ? 'Stop recording (Ctrl+Shift+M)' : 'Voice input (Ctrl+Shift+M)'}
            onClick={handleMicClick}
            style={{
              width: '32px', height: '32px', borderRadius: '8px', border: 'none',
              background: voice.isListening ? 'rgba(239,68,68,0.15)' : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: voice.isListening ? '#f87171' : '#6b7280',
              transition: 'all 0.2s ease',
              animation: voice.isListening ? 'micPulse 2s ease-in-out infinite' : 'none',
            }}
          >
            {voice.isListening
              ? <MicOff style={{ width: '16px', height: '16px' }} />
              : <Mic style={{ width: '16px', height: '16px' }} />
            }
          </button>

          {/* ── Web Search Toggle ── */}
          <button onClick={() => setWebSearchOn(v => !v)} title={webSearchOn ? 'Web Search ON — click to disable' : 'Web Search OFF — click to enable'} className={webSearchOn ? 'web-search-toggle-on' : 'web-search-toggle-off'} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', border: '1px solid transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s ease', fontFamily: 'inherit', position: 'relative' }}>
            {webSearchOn ? (
              <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', flexShrink: 0, animation: 'webPulse 2s ease-in-out infinite' }} /><Globe style={{ width: '13px', height: '13px' }} />Search</>
            ) : (
              <><Globe style={{ width: '13px', height: '13px' }} />Search</>
            )}
          </button>
        </div>

        {/* Send button */}
        <button onClick={submit} className={canSend ? 'send-btn-active' : 'send-btn-idle'} style={{ width: '36px', height: '36px', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canSend ? 'pointer' : 'default', background: canSend ? 'linear-gradient(135deg, #a78bfa, #6366f1)' : 'rgba(255,255,255,0.07)', color: canSend ? '#fff' : '#4b5563', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0 }}>
          {canSend ? (
            <ArrowUp style={{ width: '18px', height: '18px' }} strokeWidth={2.5} />
          ) : (
            <AudioLines style={{ width: '16px', height: '16px' }} strokeWidth={2} />
          )}
        </button>
      </div>
    </div>
    </>
  );
}


/* ─────────────────────────── helpers ─────────────────────────── */
function getDateLabel(ts) {
  const now = new Date(); const d = new Date(ts);
  const diff = (now - d) / 864e5;
  if (diff < 1) return 'Today';
  if (diff < 2) return 'Yesterday';
  return 'Older';
}

/* ─────────────────────────── Main Component ─────────────────────────── */
export default function ChatInterface() {
  // Multi-conversation state
  const [conversations, setConversations] = useState([]); // { id, title, messages, createdAt }
  const [activeId, setActiveId] = useState(null);         // currently open conversation id
  const [messages, setMessages] = useState([]);           // current chat messages
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // web search in progress
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const navigate = useNavigate();

  const [editPromptText, setEditPromptText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const hasMessages = messages.length > 0;

  /* ── Text-to-Speech for voice-triggered AI responses ── */
  const tts = useTextToSpeech();
  const voiceTriggeredRef = useRef(false);

  // When AI response finishes streaming and was voice-triggered → speak it
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role === 'assistant' && !last.streaming && voiceTriggeredRef.current) {
      voiceTriggeredRef.current = false;
      // Small delay for natural feel
      setTimeout(() => tts.speak(last.content), 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // ── Set dynamic page title ──
  useEffect(() => { document.title = 'ULMIND AI'; }, []);

  // ── Live Agent Handover ──
  const handover = useHandoverHook(messages);

  // ── Save current messages back into conversations list ──
  const saveCurrentConversation = useCallback((msgs, id) => {
    if (!id || msgs.length === 0) return;
    setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: msgs } : c));
  }, []);

  // ── New Chat ──
  const handleNewChat = useCallback(() => {
    // Save current conversation first
    if (activeId && messages.length > 0) {
      setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages } : c));
    }
    setMessages([]);
    setActiveId(null);
    setIsTyping(false);
  }, [activeId, messages]);

  // ── Select conversation from history ──
  const handleSelectConversation = useCallback((id) => {
    // Save current before switching
    if (activeId && messages.length > 0) {
      setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages } : c));
    }
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setMessages(conv.messages);
      setActiveId(id);
      setIsTyping(false);
    }
  }, [activeId, messages, conversations]);

  // Build sidebar conversation list with date labels — deduplicate by id
  const sidebarConversations = Array.from(
    new Map(conversations.map(c => [c.id, c])).values()
  )
    .filter(c => c.messages.length > 0)
    .map(c => ({ ...c, date: getDateLabel(c.createdAt) }))
    .reverse();

  const wsRef = useRef(null);

  const connectWS = useCallback(() => {
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/chat`);

    ws.onopen = () => {
      console.log('WS connected');
      setSocket(ws);
      wsRef.current = ws;
    };

    ws.onmessage = (e) => {
      const data = e.data;
      if (data.startsWith('SEARCH_RESULTS:')) {
        // Attach search results to the last user message
        try {
          const results = JSON.parse(data.slice('SEARCH_RESULTS:'.length));
          setIsSearching(false);
          setMessages(prev => {
            // Find the last user message and attach results to it
            const idx = [...prev].reverse().findIndex(m => m.role === 'user');
            if (idx === -1) return prev;
            const realIdx = prev.length - 1 - idx;
            const updated = [...prev];
            updated[realIdx] = { ...updated[realIdx], searchResults: results, searchTimestamp: Date.now() };
            return updated;
          });
        } catch (_) {}
      } else if (data.startsWith('CHUNK:')) {
        const chunk = data.slice(6);
        setIsTyping(false);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.streaming) {
            return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
          }
          return [...prev, { role: 'assistant', content: chunk, streaming: true }];
        });
      } else if (data === 'DONE') {
        setIsTyping(false);
        setIsSearching(false);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.streaming) return [...prev.slice(0, -1), { ...last, streaming: false }];
          return prev;
        });
      } else {
        setIsTyping(false);
        setIsSearching(false);
        setMessages((prev) => [...prev, { role: 'assistant', content: data }]);
      }
    };

    ws.onclose = () => {
      console.log('WS disconnected — retrying in 3s');
      setSocket(null);
      setTimeout(() => connectWS(), 3000); // auto-reconnect
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connectWS();
    return () => wsRef.current?.close();
  }, [connectWS]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Sync AI responses back to conversation history (only update existing, don't create)
  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    setConversations(prev => {
      // Only update if the conversation already exists
      const exists = prev.some(c => c.id === activeId);
      if (!exists) return prev;
      return prev.map(c => c.id === activeId ? { ...c, messages } : c);
    });
  }, [messages, activeId]);

  const sendMessage = useCallback((text, attachments = [], webSearch = true) => {
    const ws = wsRef.current;
    if ((!text.trim() && attachments.length === 0) || !ws || ws.readyState !== WebSocket.OPEN) return;

    const userMsg = { role: 'user', content: text.trim(), attachments };

    setMessages(prev => {
      const updated = [...prev, userMsg];

      setActiveId(currentId => {
        if (!currentId) {
          const newId = Date.now().toString();
          const titleText = text.trim() || 'File attachment';
          const newConv = {
            id: newId,
            title: titleText.slice(0, 48) + (titleText.length > 48 ? '…' : ''),
            messages: updated,
            createdAt: Date.now(),
          };
          setConversations(convs => [newConv, ...convs]);
          return newId;
        } else {
          setConversations(convs => convs.map(c => c.id === currentId ? { ...c, messages: updated } : c));
          return currentId;
        }
      });

      return updated;
    });

    setIsTyping(true);
    if (webSearch) setIsSearching(true);
    const payload = JSON.stringify({ text: text.trim(), attachments, webSearch });
    ws.send(payload);
  }, []);

  const suggestions = [
    { icon: <Terminal className="w-5 h-5 text-violet-400" />, label: 'Write a Python script', sub: 'to automate daily emails' },
    { icon: <Globe className="w-5 h-5 text-sky-400" />, label: 'Explain quantum computing', sub: 'in simple terms' },
    { icon: <Code2 className="w-5 h-5 text-emerald-400" />, label: 'Create a UI component', sub: 'for a responsive dashboard' },
    { icon: <Lightbulb className="w-5 h-5 text-amber-400" />, label: 'Brainstorm startup ideas', sub: 'in the AI/ML space' },
  ];

  return (
    <div
      className="flex w-full h-screen bg-[#212121] text-white overflow-hidden select-none"
      style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        conversations={sidebarConversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
      />

      <div className="flex-1 flex flex-col relative min-w-0 transition-all duration-300">

        {/* ── NAV ── */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: '54px', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: '#212121',
          position: 'relative', zIndex: 30,
        }}>
          {/* Left: sidebar toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
            <SidebarToggle onClick={() => setIsSidebarOpen(!isSidebarOpen)} isOpen={isSidebarOpen} />
          </div>

          {/* Center: model pill */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '24px', border: 'none',
            background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
            color: '#e5e7eb', fontSize: '14px', fontWeight: 600,
            transition: 'background 0.15s', fontFamily: 'inherit',
            letterSpacing: '-0.01em',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles style={{ width: '11px', height: '11px', color: '#fff' }} />
            </div>
            ULMIND AI
          </button>

          {/* Right: admin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 13px', borderRadius: '10px', border: 'none',
                background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
                color: '#9ca3af', fontSize: '13px', fontWeight: 500,
                transition: 'background 0.15s, color 0.15s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#f3f4f6'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#9ca3af'; }}
            >
              <Settings style={{ width: '14px', height: '14px' }} />
              Admin
            </button>
          </div>
        </header>

      {/* ── SCROLL AREA ── */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}
      >
        {(!hasMessages && !activeId) ? (
          /* ── NEW CHAT WELCOME SCREEN ── */
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '20px', zIndex: 10,
          }}>

            {/* Background ambient orbs */}
            <div style={{
              position: 'absolute', top: '10%', left: '20%',
              width: '320px', height: '320px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
              filter: 'blur(40px)', pointerEvents: 'none',
              animation: 'orbFloat1 8s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', top: '30%', right: '15%',
              width: '260px', height: '260px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
              filter: 'blur(50px)', pointerEvents: 'none',
              animation: 'orbFloat2 10s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', bottom: '25%', left: '30%',
              width: '200px', height: '200px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
              filter: 'blur(30px)', pointerEvents: 'none',
              animation: 'orbFloat1 12s ease-in-out infinite reverse',
            }} />

            <style>{`
              @keyframes orbFloat1 {
                0%, 100% { transform: translateY(0px) scale(1); }
                50% { transform: translateY(-24px) scale(1.05); }
              }
              @keyframes orbFloat2 {
                0%, 100% { transform: translateY(0px) scale(1); }
                50% { transform: translateY(18px) scale(0.96); }
              }
              @keyframes pulseGlow {
                0%, 100% { box-shadow: 0 0 30px rgba(139,92,246,0.35), 0 0 60px rgba(139,92,246,0.12); }
                50% { box-shadow: 0 0 50px rgba(139,92,246,0.55), 0 0 100px rgba(139,92,246,0.2); }
              }
              @keyframes shimmer {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
              }
              .suggestion-card:hover {
                transform: translateY(-3px) scale(1.01) !important;
                border-color: rgba(139,92,246,0.35) !important;
                background: rgba(139,92,246,0.08) !important;
              }
            `}</style>

            <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>

              {/* ── Avatar ── */}
              <div style={{
                width: '72px', height: '72px', borderRadius: '22px',
                background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 60%, #818cf8 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '28px',
                animation: 'pulseGlow 3s ease-in-out infinite',
                position: 'relative',
              }}>
                {/* Outer glow ring */}
                <div style={{
                  position: 'absolute', inset: '-4px', borderRadius: '26px',
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.4), rgba(99,102,241,0.2), rgba(129,140,248,0.4))',
                  filter: 'blur(4px)', zIndex: -1,
                }} />
                <Sparkles style={{ width: '32px', height: '32px', color: '#fff' }} />
              </div>

              {/* ── Heading ── */}
              <h1 style={{
                fontSize: 'clamp(28px, 5vw, 42px)',
                fontWeight: 800,
                textAlign: 'center',
                marginBottom: '12px',
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 40%, #a78bfa 70%, #818cf8 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 4s linear infinite',
              }}>
                What can I help with?
              </h1>

              <p style={{
                color: '#6b7280', fontSize: '14px', textAlign: 'center',
                marginBottom: '36px', lineHeight: 1.6, maxWidth: '360px',
                letterSpacing: '0.01em',
              }}>
                Ask anything — ULMIND AI searches the web and answers instantly.
              </p>

              {/* ── Suggestion Cards ── */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '12px', width: '100%',
              }}>
                {suggestions.map((s, i) => {
                  const colors = [
                    { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', icon: '#a78bfa', glow: 'rgba(139,92,246,0.15)' },
                    { bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)', icon: '#38bdf8', glow: 'rgba(56,189,248,0.12)' },
                    { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', icon: '#34d399', glow: 'rgba(52,211,153,0.12)' },
                    { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.18)', icon: '#fbbf24', glow: 'rgba(251,191,36,0.1)' },
                  ][i];
                  return (
                    <button
                      key={i}
                      className="suggestion-card"
                      onClick={() => sendMessage(`${s.label} — ${s.sub}`)}
                      style={{
                        display: 'flex', flexDirection: 'column', gap: '10px',
                        padding: '18px', borderRadius: '18px', textAlign: 'left',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {/* Card inner glow on color */}
                      <div style={{
                        position: 'absolute', top: '-20px', right: '-20px',
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: colors.glow, filter: 'blur(20px)',
                        pointerEvents: 'none',
                      }} />

                      {/* Icon badge */}
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ color: colors.icon, display: 'flex', alignItems: 'center' }}>{s.icon}</span>
                      </div>

                      <div>
                        <div style={{
                          fontSize: '13.5px', fontWeight: 600, color: '#e5e7eb',
                          marginBottom: '3px', letterSpacing: '-0.01em',
                        }}>
                          {s.label}
                        </div>
                        <div style={{
                          fontSize: '12px', color: '#6b7280', lineHeight: 1.5,
                        }}>
                          {s.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── CHAT ── */
          <div style={{ width: '100%', paddingBottom: '200px' }}>
            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{ display: 'flex', width: '100%', flexDirection: 'column' }}
              >
                {/* Search Results Card — shown below user message when web search was active */}
                {msg.role === 'user' && msg.searchResults?.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: 8 }}>
                    <div style={{ width: '100%', maxWidth: '100%' }}>
                      <SearchResultsCard
                        results={msg.searchResults}
                        query={msg.content}
                        timestamp={msg.searchTimestamp}
                      />
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', width: '100%', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'user' ? (
                  /* User bubble */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '78%' }} className="msg-group">
                    <style>{`
                      @keyframes bubbleIn {
                        from { opacity: 0; transform: translateY(8px) scale(0.97); }
                        to   { opacity: 1; transform: translateY(0)  scale(1); }
                      }
                      .user-bubble { animation: bubbleIn 0.22s cubic-bezier(0.4,0,0.2,1) both; }
                      .user-bubble:hover { box-shadow: 0 8px 32px rgba(139,92,246,0.2), 0 0 0 1px rgba(139,92,246,0.25) inset !important; }
                      .bubble-action:hover { background: rgba(255,255,255,0.12) !important; color: #e5e7eb !important; }
                      .msg-group:hover .msg-actions { opacity: 1 !important; visibility: visible !important; }
                    `}</style>

                    {/* The bubble */}
                    <div
                      className="user-bubble"
                      style={{
                        position: 'relative',
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.14) 50%, rgba(255,255,255,0.07) 100%)',
                        border: '1px solid rgba(139,92,246,0.3)',
                        borderRadius: '20px 20px 6px 20px',
                        padding: '13px 20px',
                        color: '#f3f4f6',
                        fontSize: '15.5px',
                        lineHeight: 1.65,
                        fontWeight: 450,
                        wordBreak: 'break-word',
                        userSelect: 'text',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        boxShadow: '0 4px 24px rgba(139,92,246,0.12), 0 0 0 1px rgba(139,92,246,0.15) inset',
                        transition: 'box-shadow 0.2s ease',
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {/* Corner accent glow */}
                      <div style={{
                        position: 'absolute', top: '-1px', right: '-1px',
                        width: '40px', height: '40px', borderRadius: '0 20px 0 0',
                        background: 'radial-gradient(circle at top right, rgba(167,139,250,0.25), transparent 70%)',
                        pointerEvents: 'none',
                      }} />
                      {msg.content}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: msg.content ? '10px' : '0', flexWrap: 'wrap' }}>
                          {msg.attachments.map((att, i) => (
                            <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.1)' }}>
                              {att.preview ? (
                                <img src={att.preview} alt="attachment" style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain', display: 'block' }} />
                              ) : (
                                <div style={{ padding: '8px 12px', fontSize: '12px', color: '#cbd5e1' }}>📄 {att.name}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Hover actions */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      marginTop: '6px', marginRight: '4px',
                      opacity: 0, visibility: 'hidden', transition: 'opacity 0.18s ease, visibility 0.18s ease',
                    }}
                      className="msg-actions"
                    >
                      <button
                        title="Copy"
                        className="bubble-action"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          setCopiedIndex(idx);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '26px', height: '26px', borderRadius: '8px', border: 'none',
                          background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
                          color: '#9ca3af',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                      >
                        {copiedIndex === idx ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                      </button>
                      <button
                        title="Edit"
                        className="bubble-action"
                        onClick={() => {
                          setEditPromptText(msg.content);
                          setMessages(prev => prev.slice(0, idx)); // remove this msg and all after it
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '26px', height: '26px', borderRadius: '8px', border: 'none',
                          background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
                          color: '#9ca3af',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* AI message */
                  <div className="flex gap-4 w-full max-w-full">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
                      <Sparkles className="w-4 h-4 text-black" />
                    </div>
                    <div className="flex-1 min-w-0 select-text">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          code: CodeBlock,
                          p: ({ node, ...p }) => <p className="mb-4 last:mb-0 text-[15px] leading-[1.85] text-gray-100" {...p} />,
                          ul: ({ node, ...p }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-100 text-[15px]" {...p} />,
                          ol: ({ node, ...p }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-100 text-[15px]" {...p} />,
                          li: ({ node, ...p }) => <li className="text-[15px] leading-relaxed" {...p} />,
                          a: ({ node, ...p }) => <a className="text-blue-400 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...p} />,
                          strong: ({ node, ...p }) => <strong className="font-semibold text-white" {...p} />,
                          em: ({ node, ...p }) => <em className="italic text-gray-300" {...p} />,
                          h1: ({ node, ...p }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-white" {...p} />,
                          h2: ({ node, ...p }) => <h2 className="text-xl font-bold mb-3 mt-5 text-white" {...p} />,
                          h3: ({ node, ...p }) => <h3 className="text-[17px] font-semibold mb-3 mt-4 text-gray-100" {...p} />,
                          blockquote: ({ node, ...p }) => <blockquote className="border-l-2 border-gray-600 pl-4 my-4 text-gray-400 italic" {...p} />,
                          hr: () => <hr className="border-[#3f3f3f] my-5" />,
                          table: ({ node, ...p }) => <div className="overflow-x-auto my-4"><table className="min-w-full text-[14px] border border-[#3f3f3f] rounded-lg overflow-hidden" {...p} /></div>,
                          thead: ({ node, ...p }) => <thead className="bg-[#2a2a2a]" {...p} />,
                          th: ({ node, ...p }) => <th className="px-4 py-2 text-left font-semibold text-gray-200 border-b border-[#3f3f3f]" {...p} />,
                          td: ({ node, ...p }) => <td className="px-4 py-2 text-gray-300 border-b border-[#2f2f2f]" {...p} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>

                      {/* AI Actions */}
                      {!msg.streaming && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <button 
                            title="Copy"
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <Copy size={13} />
                          </button>
                          <button 
                            title="Good response"
                            className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <ThumbsUp size={13} />
                          </button>
                          <button 
                            title="Bad response"
                            className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <ThumbsDown size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            ))}

            {/* Searching the web indicator */}
            {isSearching && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <div style={{
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#818cf8',
                    animation: 'webPulse 1.5s ease-in-out infinite', display: 'inline-block',
                  }} />
                  <span style={{ fontSize: 13, color: '#a5b4fc', fontWeight: 500 }}>Searching the web...</span>
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-4 w-full justify-start">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
                <div className="flex items-center h-8">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* ── INPUT — floating premium panel ── */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          zIndex: 50, pointerEvents: 'none',
          background: 'linear-gradient(to top, #1a1a1a 55%, rgba(26,26,26,0.95) 75%, transparent)',
          paddingBottom: '28px', paddingTop: '60px',
          paddingLeft: '20px', paddingRight: '20px',
        }}
      >
        <div style={{ pointerEvents: 'auto', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
          <InputBox
            onSend={sendMessage}
            editPromptText={editPromptText}
            clearEditPrompt={() => setEditPromptText('')}
            voiceTriggeredRef={voiceTriggeredRef}
          />
          {/* TTS Speaking Indicator */}
          {tts.isSpeaking && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, marginTop: 8,
            }}>
              <button
                onClick={tts.stop}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 14px', borderRadius: 20,
                  background: 'rgba(139,92,246,0.12)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  color: '#c4b5fd', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {[0,1,2,3].map(i => (
                    <span key={i} style={{
                      width: 3, height: 10 + Math.random() * 6,
                      borderRadius: 2, background: '#a78bfa',
                      animation: `ttsBar 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                    }} />
                  ))}
                </span>
                <style>{`@keyframes ttsBar{0%{transform:scaleY(0.4);opacity:0.5}100%{transform:scaleY(1);opacity:1}}`}</style>
                AI is speaking… tap to stop
              </button>
            </div>
          )}
          <p style={{
            textAlign: 'center', fontSize: '11px',
            color: 'rgba(107,114,128,0.6)',
            marginTop: '10px', letterSpacing: '0.01em',
          }}>
            ULMIND AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>
      </div>

      {/* ── LIVE AGENT HANDOVER UI ── */}
      <EscalationModal
        isOpen={handover.showModal}
        onConfirm={handover.triggerEscalation}
        onDismiss={handover.dismissModal}
        triggerReason={handover.triggerReason}
      />
      <LiveChatWindow
        status={handover.status}
        agentInfo={handover.agentInfo}
        agentMessages={handover.agentMessages}
        onSendMessage={handover.sendUserMessage}
        onClose={handover.dismissModal}
        escalation={handover.escalation}
        waitTime={handover.waitTime}
      />
      <FloatingSupportButton
        onClick={handover.openModal}
        status={handover.status}
        agentsOnline={2}
      />
    </div>
  );
}
