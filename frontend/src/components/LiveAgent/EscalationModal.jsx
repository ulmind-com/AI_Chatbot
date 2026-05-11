/**
 * EscalationModal — Glassmorphism popup triggered when human handover is detected
 */
import React, { useState, useEffect } from 'react';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low — General inquiry', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { value: 'normal', label: 'Normal — Need assistance', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { value: 'high', label: 'High — Urgent issue', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'critical', label: 'Critical — Payment / Refund', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
];

const REASON_LABELS = {
  human_requested: '🙋 You requested a human agent',
  frustration_detected: '😟 We detected frustration — let us help!',
  sensitive_topic: '🔐 Sensitive topic detected',
  repeated_request: '🔄 Multiple requests for human support',
};

export default function EscalationModal({ isOpen, onConfirm, onDismiss, triggerReason }) {
  const [userName, setUserName] = useState('');
  const [priority, setPriority] = useState('normal');
  const [visible, setVisible] = useState(false);
  const [agentsOnline] = useState(2);

  useEffect(() => {
    if (isOpen) setTimeout(() => setVisible(true), 10);
    else setVisible(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({ userName: userName.trim() || 'Anonymous User', priority });
  };

  const selected = PRIORITY_OPTIONS.find(p => p.value === priority);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.25s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: '440px', margin: '16px',
        background: 'linear-gradient(145deg, rgba(26,26,36,0.98), rgba(18,18,28,0.99))',
        border: '1px solid rgba(139,92,246,0.25)',
        borderRadius: '24px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.08) inset, 0 0 80px rgba(99,102,241,0.07)',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(20px)',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        overflow: 'hidden',
        fontFamily: "'Inter','Outfit',sans-serif",
      }}>
        {/* Purple gradient header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
          borderBottom: '1px solid rgba(139,92,246,0.15)',
          padding: '28px 28px 24px',
          position: 'relative',
        }}>
          {/* Animated orbs */}
          <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'120px', height:'120px',
            borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            pointerEvents:'none' }} />

          <div style={{ display:'flex', alignItems:'flex-start', gap:'16px' }}>
            {/* Icon */}
            <div style={{
              width:'52px', height:'52px', borderRadius:'16px', flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
            }}>
              <span style={{ fontSize:'24px' }}>🎧</span>
            </div>
            <div style={{ flex:1 }}>
              <h2 style={{ margin:0, fontSize:'20px', fontWeight:700, color:'#f3f4f6', letterSpacing:'-0.02em' }}>
                Connect to Human Agent
              </h2>
              <p style={{ margin:'6px 0 0', fontSize:'13px', color:'#9ca3af' }}>
                {REASON_LABELS[triggerReason] || '💬 Connect with our support team'}
              </p>
            </div>
          </div>

          {/* Agent availability */}
          <div style={{
            marginTop:'16px', display:'flex', alignItems:'center', gap:'8px',
            background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)',
            borderRadius:'12px', padding:'10px 14px',
          }}>
            <span style={{ fontSize:'12px', color:'#10b981', fontWeight:600 }}>
              ● {agentsOnline} agents online
            </span>
            <span style={{ color:'rgba(255,255,255,0.15)', margin:'0 4px' }}>|</span>
            <span style={{ fontSize:'12px', color:'#6b7280' }}>Est. wait: <strong style={{color:'#d1d5db'}}>2-5 min</strong></span>
            <span style={{ color:'rgba(255,255,255,0.15)', margin:'0 4px' }}>|</span>
            <span style={{ fontSize:'12px', color:'#6b7280' }}>Avg. resolution: <strong style={{color:'#d1d5db'}}>8 min</strong></span>
          </div>
        </div>

        {/* Form body */}
        <div style={{ padding:'24px 28px 28px', display:'flex', flexDirection:'column', gap:'18px' }}>
          {/* Name field */}
          <div>
            <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#9ca3af',
              textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px' }}>
              Your Name (optional)
            </label>
            <input
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="e.g. John Doe"
              style={{
                width:'100%', background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px',
                padding:'12px 16px', color:'#f3f4f6', fontSize:'14px',
                outline:'none', boxSizing:'border-box', fontFamily:'inherit',
                transition:'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Priority selector */}
          <div>
            <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#9ca3af',
              textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px' }}>
              Issue Priority
            </label>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {PRIORITY_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  style={{
                    display:'flex', alignItems:'center', gap:'12px',
                    padding:'10px 14px', borderRadius:'12px', cursor:'pointer',
                    border: priority === opt.value
                      ? `1px solid ${opt.color}55`
                      : '1px solid rgba(255,255,255,0.07)',
                    background: priority === opt.value ? opt.bg : 'rgba(255,255,255,0.02)',
                    transition:'all 0.15s', textAlign:'left',
                  }}
                >
                  <span style={{
                    width:'10px', height:'10px', borderRadius:'50%', flexShrink:0,
                    background: opt.color,
                    boxShadow: priority === opt.value ? `0 0 8px ${opt.color}` : 'none',
                  }} />
                  <span style={{ fontSize:'13px', color: priority === opt.value ? '#f3f4f6' : '#9ca3af', fontFamily:'inherit' }}>
                    {opt.label}
                  </span>
                  {priority === opt.value && (
                    <span style={{ marginLeft:'auto', fontSize:'11px', color: opt.color, fontWeight:600 }}>✓ Selected</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:'10px', marginTop:'4px' }}>
            <button onClick={onDismiss} style={{
              flex:1, padding:'12px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.1)',
              background:'rgba(255,255,255,0.04)', color:'#9ca3af', fontSize:'14px',
              fontWeight:500, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
            }}
              onMouseEnter={e => { e.target.style.background='rgba(255,255,255,0.08)'; e.target.style.color='#f3f4f6'; }}
              onMouseLeave={e => { e.target.style.background='rgba(255,255,255,0.04)'; e.target.style.color='#9ca3af'; }}
            >
              Maybe Later
            </button>
            <button onClick={handleConfirm} style={{
              flex:2, padding:'12px', borderRadius:'12px', border:'none',
              background:'linear-gradient(135deg, #6366f1, #a855f7)',
              color:'#fff', fontSize:'14px', fontWeight:600, cursor:'pointer',
              fontFamily:'inherit', transition:'all 0.2s',
              boxShadow:'0 8px 24px rgba(99,102,241,0.4)',
            }}
              onMouseEnter={e => { e.target.style.transform='translateY(-1px)'; e.target.style.boxShadow='0 12px 32px rgba(99,102,241,0.5)'; }}
              onMouseLeave={e => { e.target.style.transform='translateY(0)'; e.target.style.boxShadow='0 8px 24px rgba(99,102,241,0.4)'; }}
            >
              🎧 Connect to Agent
            </button>
          </div>

          <p style={{ margin:0, textAlign:'center', fontSize:'11px', color:'rgba(156,163,175,0.5)' }}>
            Your AI chat history will be shared with the agent for context
          </p>
        </div>
      </div>
    </div>
  );
}
