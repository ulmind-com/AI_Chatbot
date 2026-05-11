/**
 * SearchResultsCard — Perplexity/ChatGPT Browse style search results
 * Shown in the chat above the AI response when web search is active
 */
import React, { useState } from 'react';

function FaviconImg({ src, domain }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        background: 'linear-gradient(135deg,#6366f1,#a855f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: '#fff', fontWeight: 700,
      }}>
        {(domain || 'W')[0].toUpperCase()}
      </div>
    );
  }
  return (
    <img src={src} alt="" onError={() => setErr(true)} style={{
      width: 16, height: 16, borderRadius: 4, flexShrink: 0, objectFit: 'contain',
    }} />
  );
}

export default function SearchResultsCard({ results = [], query = '', timestamp }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? results : results.slice(0, 3);

  if (!results.length) return null;

  return (
    <div style={{
      marginBottom: 12,
      background: 'rgba(99,102,241,0.06)',
      border: '1px solid rgba(99,102,241,0.18)',
      borderRadius: 16,
      overflow: 'hidden',
      fontFamily: "'Inter','Outfit',sans-serif",
      animation: 'searchCardIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <style>{`
        @keyframes searchCardIn {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .src-card:hover { background: rgba(99,102,241,0.1) !important; }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        borderBottom: '1px solid rgba(99,102,241,0.12)',
        background: 'rgba(99,102,241,0.08)',
      }}>
        {/* Animated search icon */}
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#a5b4fc' }}>
          Web Search
        </span>
        <span style={{ fontSize: 11, color: '#6b7280', flex: 1 }}>
          · {results.length} sources found
          {query && <> · <em style={{ fontStyle: 'normal', color: '#818cf8' }}>"{query.slice(0,40)}{query.length>40?'…':''}"</em></>}
        </span>
        {timestamp && (
          <span style={{ fontSize: 10, color: '#4b5563' }}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Source cards */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {shown.map((r, i) => (
          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
            className="src-card"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '8px 10px', borderRadius: 10, textDecoration: 'none',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              transition: 'background 0.15s',
              cursor: 'pointer',
            }}>
            {/* Index + favicon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 1 }}>
              <span style={{
                width: 18, height: 18, borderRadius: 6, flexShrink: 0,
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#818cf8',
              }}>{i + 1}</span>
              <FaviconImg src={r.favicon} domain={r.domain} />
            </div>
            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: '#e5e7eb',
                marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                lineHeight: 1.3,
              }}>{r.title}</div>
              <div style={{
                fontSize: 11, color: '#818cf8', marginBottom: 3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{r.domain}</div>
              {r.snippet && (
                <div style={{
                  fontSize: 12, color: '#6b7280', lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{r.snippet}</div>
              )}
            </div>
            {/* External link icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" style={{ flexShrink: 0, marginTop: 4 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        ))}
      </div>

      {/* Show more / less */}
      {results.length > 3 && (
        <div style={{ padding: '4px 10px 10px' }}>
          <button onClick={() => setExpanded(!expanded)} style={{
            width: '100%', padding: '7px', borderRadius: 8,
            border: '1px solid rgba(99,102,241,0.2)',
            background: 'rgba(99,102,241,0.06)', color: '#818cf8',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}>
            {expanded ? `▲ Show fewer sources` : `▼ Show ${results.length - 3} more sources`}
          </button>
        </div>
      )}
    </div>
  );
}
