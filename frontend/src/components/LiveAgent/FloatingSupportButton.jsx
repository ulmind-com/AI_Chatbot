/**
 * FloatingSupportButton — Floating "Live Support" button (bottom-right)
 * Shows agent count, pulse animation, opens escalation modal on click
 */
import React, { useState } from 'react';

export default function FloatingSupportButton({ onClick, status, agentsOnline = 2 }) {
  const [hovered, setHovered] = useState(false);

  const isActive = ['waiting', 'active'].includes(status);
  const isResolved = status === 'resolved';

  const buttonColor = isActive
    ? 'linear-gradient(135deg, #10b981, #059669)'
    : 'linear-gradient(135deg, #6366f1, #a855f7)';

  const glowColor = isActive
    ? 'rgba(16,185,129,0.45)'
    : 'rgba(99,102,241,0.45)';

  const label = isActive
    ? (status === 'waiting' ? 'Finding Agent...' : 'Live Chat Active')
    : 'Live Support';

  return (
    <div className="floating-btn-mobile" style={{
      position:'fixed', bottom:'24px', right:'24px', zIndex:7999,
      display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px',
      fontFamily:"'Inter','Outfit',sans-serif",
    }}>
      {/* Tooltip label */}
      <div style={{
        background:'rgba(15,15,26,0.95)', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:'10px', padding:'6px 12px', fontSize:'12px', fontWeight:600,
        color:'#f3f4f6', whiteSpace:'nowrap',
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateY(0) scale(1)' : 'translateY(4px) scale(0.95)',
        transition:'all 0.2s ease', pointerEvents:'none',
        boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
      }}>
        {label}
        {!isActive && (
          <span style={{ marginLeft:'6px', color:'#10b981' }}>
            ● {agentsOnline} online
          </span>
        )}
      </div>

      {/* Main FAB */}
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width:'56px', height:'56px', borderRadius:'50%', border:'none',
          background: buttonColor,
          cursor:'pointer', position:'relative', overflow:'visible',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: hovered
            ? `0 12px 40px ${glowColor}, 0 0 0 4px ${glowColor.replace('0.45','0.15')}`
            : `0 8px 24px ${glowColor}`,
          transform: hovered ? 'translateY(-3px) scale(1.05)' : 'translateY(0) scale(1)',
          transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Pulse ring (always on) */}
        {!isResolved && (
          <>
            <span style={{
              position:'absolute', inset:'-6px', borderRadius:'50%',
              border: `2px solid ${isActive ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
              animation:'supportPulse 2s infinite',
            }} />
            <span style={{
              position:'absolute', inset:'-12px', borderRadius:'50%',
              border: `1px solid ${isActive ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)'}`,
              animation:'supportPulse 2s 0.5s infinite',
            }} />
          </>
        )}

        {/* Icon */}
        <span style={{ fontSize:'22px', lineHeight:1, position:'relative', zIndex:1 }}>
          {status === 'waiting' ? '⏳' : status === 'active' ? '💬' : status === 'resolved' ? '✅' : '🎧'}
        </span>

        {/* Active dot */}
        {isActive && (
          <span style={{
            position:'absolute', top:'4px', right:'4px',
            width:'12px', height:'12px', borderRadius:'50%',
            background:'#10b981', border:'2px solid #0f0f1a',
            animation:'supportPulse 1.5s infinite',
          }} />
        )}
      </button>

      <style>{`
        @keyframes supportPulse {
          0%  { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(1.1); }
          100%{ opacity:1; transform:scale(1); }
        }
      `}</style>
    </div>
  );
}
