/**
 * LiveChatWindow — Real-time chat panel between user and human agent
 * Shows when escalation is active (status: waiting | active | resolved)
 */
import React, { useState, useRef, useEffect } from 'react';

function TypingDots() {
  return (
    <div style={{ display:'flex', gap:'4px', padding:'4px 0', alignItems:'center' }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width:'7px', height:'7px', borderRadius:'50%',
          background:'rgba(139,92,246,0.6)',
          display:'inline-block',
          animation:'liveBounce 0.9s infinite',
          animationDelay:`${i*150}ms`,
        }} />
      ))}
      <style>{`
        @keyframes liveBounce {
          0%,80%,100%{ transform:translateY(0) }
          40%{ transform:translateY(-5px) }
        }
      `}</style>
    </div>
  );
}

function AgentAvatar({ name = 'Agent', color = '#6366f1' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{
      width:'32px', height:'32px', borderRadius:'50%', flexShrink:0,
      background:`linear-gradient(135deg, ${color}, ${color}99)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:'12px', fontWeight:700, color:'#fff',
      boxShadow:`0 4px 12px ${color}55`,
    }}>{initials}</div>
  );
}

export default function LiveChatWindow({
  status, agentInfo, agentMessages, onSendMessage, onClose, escalation, waitTime
}) {
  const [input, setInput] = useState('');
  const [agentTyping, setAgentTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages, agentTyping]);

  useEffect(() => {
    if (status === 'active' && !minimized) inputRef.current?.focus();
  }, [status, minimized]);

  const sendMsg = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    // Simulate agent typing indicator briefly
    setAgentTyping(true);
    setTimeout(() => setAgentTyping(false), 2500 + Math.random() * 2000);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  const statusConfig = {
    waiting: { label: 'Connecting to agent...', color: '#f59e0b', pulse: true },
    active: { label: `Connected to ${agentInfo?.name || 'Agent'}`, color: '#10b981', pulse: false },
    resolved: { label: 'Chat resolved', color: '#6b7280', pulse: false },
    rejected: { label: 'No agents available', color: '#ef4444', pulse: false },
  };
  const sc = statusConfig[status] || statusConfig.waiting;

  if (!['waiting', 'active', 'resolved', 'rejected'].includes(status)) return null;

  return (
    <div style={{
      position:'fixed', bottom:'88px', right:'24px', zIndex:8000,
      width: minimized ? '280px' : '360px',
      fontFamily:"'Inter','Outfit',sans-serif",
      boxShadow:'0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.15)',
      borderRadius:'20px', overflow:'hidden',
      transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      animation: 'slideUpIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <style>{`
        @keyframes slideUpIn {
          from { opacity:0; transform:translateY(40px) scale(0.92); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes pulseRing {
          0%  { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
          100%{ box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background:'linear-gradient(135deg, #1e1b4b, #312e81)',
        borderBottom:'1px solid rgba(139,92,246,0.2)',
        padding:'14px 16px',
        display:'flex', alignItems:'center', gap:'12px',
        cursor:'pointer',
      }} onClick={() => setMinimized(!minimized)}>
        {/* Agent avatar / waiting spinner */}
        {status === 'waiting' ? (
          <div style={{
            width:'36px', height:'36px', borderRadius:'50%', flexShrink:0,
            border:'2px solid rgba(245,158,11,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center',
            animation:'spin 1.5s linear infinite',
          }}>
            <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
            <span style={{ fontSize:'16px' }}>⏳</span>
          </div>
        ) : (
          <div style={{ position:'relative' }}>
            <AgentAvatar name={agentInfo?.name || 'Agent'} color="#6366f1" />
            {status === 'active' && (
              <span style={{
                position:'absolute', bottom:'0', right:'0',
                width:'10px', height:'10px', borderRadius:'50%',
                background:'#10b981', border:'2px solid #1e1b4b',
              }} />
            )}
          </div>
        )}

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'13px', fontWeight:600, color:'#f3f4f6', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {status === 'waiting' ? 'Finding best agent...' : agentInfo?.name || 'Support Agent'}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'2px' }}>
            <span style={{
              width:'7px', height:'7px', borderRadius:'50%', background:sc.color, flexShrink:0,
              animation: sc.pulse ? 'pulseRing 1.5s infinite' : 'none',
            }} />
            <span style={{ fontSize:'11px', color: sc.color }}>{sc.label}</span>
          </div>
        </div>

        <div style={{ display:'flex', gap:'4px' }}>
          <button onClick={e => { e.stopPropagation(); setMinimized(!minimized); }} style={{
            width:'28px', height:'28px', borderRadius:'8px', border:'none',
            background:'rgba(255,255,255,0.08)', color:'#9ca3af',
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'16px', transition:'background 0.15s',
          }}
            onMouseEnter={e => e.target.style.background='rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.target.style.background='rgba(255,255,255,0.08)'}
          >{minimized ? '▲' : '▼'}</button>
          <button onClick={e => { e.stopPropagation(); onClose(); }} style={{
            width:'28px', height:'28px', borderRadius:'8px', border:'none',
            background:'rgba(239,68,68,0.1)', color:'#ef4444',
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'16px', transition:'background 0.15s',
          }}
            onMouseEnter={e => e.target.style.background='rgba(239,68,68,0.2)'}
            onMouseLeave={e => e.target.style.background='rgba(239,68,68,0.1)'}
          >×</button>
        </div>
      </div>

      {/* ── Body (hidden when minimized) ── */}
      {!minimized && (
        <>
          {/* Waiting state info */}
          {status === 'waiting' && (
            <div style={{
              background:'linear-gradient(180deg, #0f0f1a, #0a0a14)',
              padding:'20px', textAlign:'center',
            }}>
              <div style={{
                width:'60px', height:'60px', margin:'0 auto 16px',
                borderRadius:'50%', background:'rgba(245,158,11,0.1)',
                border:'2px dashed rgba(245,158,11,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                animation:'spin 3s linear infinite',
              }}>
                <span style={{ fontSize:'24px' }}>🎧</span>
              </div>
              <p style={{ margin:'0 0 8px', fontSize:'14px', fontWeight:600, color:'#f3f4f6' }}>
                You're in the queue
              </p>
              <p style={{ margin:'0 0 16px', fontSize:'12px', color:'#6b7280' }}>
                Estimated wait time: <strong style={{ color:'#f59e0b' }}>{waitTime || '2-5 min'}</strong>
              </p>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:'8px',
                background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)',
                borderRadius:'10px', padding:'8px 14px',
              }}>
                <span style={{ fontSize:'12px', color:'#a5b4fc' }}>
                  Priority: <strong style={{ textTransform:'capitalize' }}>
                    {escalation?.priority || 'normal'}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* Messages area */}
          {(status === 'active' || status === 'resolved') && (
            <div style={{
              background:'#0f0f1a', height:'280px', overflowY:'auto',
              padding:'12px', display:'flex', flexDirection:'column', gap:'10px',
              scrollbarWidth:'none',
            }}>
              {agentMessages.length === 0 && (
                <div style={{ textAlign:'center', color:'#4b5563', fontSize:'12px', marginTop:'40px' }}>
                  Chat session started. Say hello! 👋
                </div>
              )}

              {agentMessages.map((msg, i) => (
                <div key={msg.id || i} style={{
                  display:'flex', gap:'8px',
                  flexDirection: msg.from === 'user' ? 'row-reverse' : 'row',
                  alignItems:'flex-end',
                }}>
                  {msg.from === 'agent' && <AgentAvatar name={agentInfo?.name || 'Agent'} color="#6366f1" />}
                  {msg.from === 'system' && (
                    <div style={{
                      width:'100%', textAlign:'center', fontSize:'11px',
                      color:'#10b981', background:'rgba(16,185,129,0.08)',
                      border:'1px solid rgba(16,185,129,0.15)', borderRadius:'8px', padding:'8px 12px',
                    }}>{msg.text}</div>
                  )}
                  {msg.from !== 'system' && (
                    <div style={{
                      maxWidth:'75%', padding:'10px 14px', borderRadius:
                        msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: msg.from === 'user'
                        ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                        : 'rgba(255,255,255,0.06)',
                      border: msg.from === 'agent' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      fontSize:'13px', lineHeight:'1.5', color:'#f3f4f6',
                      boxShadow: msg.from === 'user' ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                    }}>
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}

              {agentTyping && status === 'active' && (
                <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
                  <AgentAvatar name={agentInfo?.name || 'Agent'} color="#6366f1" />
                  <div style={{
                    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:'18px 18px 18px 4px', padding:'10px 14px',
                  }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input area */}
          {status === 'active' && (
            <div style={{
              background:'#0f0f1a', borderTop:'1px solid rgba(255,255,255,0.06)',
              padding:'10px 12px', display:'flex', gap:'8px', alignItems:'flex-end',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message..."
                rows={1}
                style={{
                  flex:1, background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px',
                  padding:'10px 12px', color:'#f3f4f6', fontSize:'13px',
                  outline:'none', resize:'none', fontFamily:'inherit',
                  maxHeight:'80px', overflowY:'auto', lineHeight:'1.4',
                  transition:'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
              <button onClick={sendMsg} disabled={!input.trim()} style={{
                width:'38px', height:'38px', flexShrink:0, borderRadius:'12px', border:'none',
                background: input.trim()
                  ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                  : 'rgba(255,255,255,0.05)',
                color: input.trim() ? '#fff' : '#4b5563',
                cursor: input.trim() ? 'pointer' : 'default',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'16px', transition:'all 0.2s',
                boxShadow: input.trim() ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
              }}>↑</button>
            </div>
          )}

          {status === 'resolved' && (
            <div style={{
              background:'#0f0f1a', borderTop:'1px solid rgba(255,255,255,0.06)',
              padding:'14px', textAlign:'center',
            }}>
              <p style={{ margin:0, fontSize:'12px', color:'#6b7280' }}>
                This chat has been resolved. Start a new conversation?
              </p>
            </div>
          )}

          {status === 'rejected' && (
            <div style={{
              background:'#0f0f1a', padding:'20px', textAlign:'center',
            }}>
              <p style={{ margin:'0 0 8px', fontSize:'14px', color:'#ef4444' }}>No agents available</p>
              <p style={{ margin:0, fontSize:'12px', color:'#6b7280' }}>
                Please try again later or leave a message.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
