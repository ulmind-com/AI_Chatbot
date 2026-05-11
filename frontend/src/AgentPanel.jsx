import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/agent`;

const PRIORITY_COLORS = {
  low: '#10b981', normal: '#6366f1', high: '#f59e0b', critical: '#ef4444'
};

const STATUS_BADGE = {
  waiting:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b',  label: 'Waiting'  },
  active:   { bg: 'rgba(16,185,129,0.15)',  color: '#10b981',  label: 'Active'   },
  resolved: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af',  label: 'Resolved' },
  rejected: { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444',  label: 'Rejected' },
};

function AgentAvatar({ name = 'A', color = '#6366f1', size = 36, online = false }) {
  const ini = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, fontWeight: 700, color: '#fff',
        boxShadow: `0 4px 12px ${color}44`,
      }}>{ini}</div>
      {online !== undefined && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          background: online ? '#10b981' : '#6b7280',
          border: '2px solid #12121e',
        }} />
      )}
    </div>
  );
}

function Badge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.waiting;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

function LiveChat({ esc, agentId, onResolve }) {
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState(esc.messages || []);
  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(`${API.replace('http','ws')}/ws/agent/${agentId}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const p = JSON.parse(e.data);
      if (p.type === 'user_message' && p.escalation_id === esc.id) {
        setMsgs(prev => [...prev, p.message]);
      }
    };
    return () => ws.close();
  }, [agentId, esc.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    const res = await fetch(`${API}/message/agent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escalation_id: esc.id, agent_id: agentId, text }),
    });
    const msg = await res.json();
    setMsgs(prev => [...prev, msg]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'agent' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '70%', padding: '10px 14px', borderRadius: m.from === 'agent' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.from === 'agent' ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'rgba(255,255,255,0.07)',
              fontSize: 13, color: '#f3f4f6', lineHeight: 1.5,
            }}>{m.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Reply to user..."
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '10px 14px', color: '#f3f4f6', fontSize: 13,
            outline: 'none', fontFamily: 'inherit',
          }} />
        <button onClick={send} style={{
          padding: '10px 16px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff',
          fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
        }}>Send</button>
        <button onClick={() => onResolve(esc.id)} style={{
          padding: '10px 16px', borderRadius: 12, border: 'none',
          background: 'rgba(16,185,129,0.15)', color: '#10b981',
          fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
          border: '1px solid rgba(16,185,129,0.25)',
        }}>✓ Resolve</button>
      </div>
    </div>
  );
}

export default function AgentPanel() {
  const navigate = useNavigate();
  const [agentId]    = useState('agent-001');
  const [queue,  setQueue]  = useState([]);
  const [active, setActive] = useState([]);
  const [agents, setAgents] = useState([]);
  const [analytics, setAn]  = useState(null);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('queue');
  const wsRef = useRef(null);

  const load = useCallback(async () => {
    const [q, a, ag, an] = await Promise.all([
      fetch(`${API}/queue`).then(r => r.json()),
      fetch(`${API}/active`).then(r => r.json()),
      fetch(`${API}/agents`).then(r => r.json()),
      fetch(`${API}/analytics`).then(r => r.json()),
    ]);
    setQueue(q); setActive(a); setAgents(ag); setAn(an);
  }, []);

  useEffect(() => {
    load();
    const ws = new WebSocket(`${API.replace('http','ws')}/ws/agent/${agentId}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const p = JSON.parse(e.data);
      if (['new_escalation','new_chat_assigned','queue_update'].includes(p.type)) load();
    };
    const interval = setInterval(load, 10000);
    return () => { ws.close(); clearInterval(interval); };
  }, [load, agentId]);

  const accept = async (escId) => {
    await fetch(`${API}/accept`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escalation_id: escId, agent_id: agentId }),
    });
    load();
  };

  const reject = async (escId) => {
    await fetch(`${API}/reject`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escalation_id: escId }),
    });
    load();
  };

  const resolve = async (escId) => {
    await fetch(`${API}/resolve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escalation_id: escId, agent_id: agentId }),
    });
    setSelected(null); load();
  };

  const me = agents.find(a => a.id === agentId) || {};
  const allEscs = [...queue, ...active];
  const selEsc = selected && allEscs.find(e => e.id === selected);

  const statCards = [
    { label: 'Total Escalations', value: analytics?.total_escalations ?? 0, color: '#6366f1', icon: '📊' },
    { label: 'Active Now',        value: analytics?.active ?? 0,             color: '#10b981', icon: '💬' },
    { label: 'Waiting',           value: analytics?.waiting ?? 0,            color: '#f59e0b', icon: '⏳' },
    { label: 'Resolved Today',    value: analytics?.resolved ?? 0,           color: '#a855f7', icon: '✅' },
  ];

  return (
    <div style={{
      display: 'flex', height: '100vh', background: '#0a0a14',
      color: '#f3f4f6', fontFamily: "'Inter','Outfit',sans-serif", overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#0f0f1e', borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg,#6366f1,#a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>🎧</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>Agent Panel</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Live Support</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 8px', flex: 1 }}>
          {[
            { key: 'queue',    icon: '⏳', label: 'Queue',      count: queue.length  },
            { key: 'active',   icon: '💬', label: 'Active',     count: active.length },
            { key: 'analytics',icon: '📊', label: 'Analytics',  count: null          },
            { key: 'agents',   icon: '👥', label: 'Team',       count: agents.length },
          ].map(item => (
            <button key={item.key} onClick={() => { setTab(item.key); setSelected(null); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: tab === item.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: tab === item.key ? '#a5b4fc' : '#6b7280',
                fontSize: 13, fontWeight: 500, marginBottom: 2,
                fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'left',
              }}>
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count != null && item.count > 0 && (
                <span style={{
                  background: tab === item.key ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                  color: tab === item.key ? '#a5b4fc' : '#9ca3af',
                  borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 600,
                }}>{item.count}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <AgentAvatar name={me.name || 'Agent'} color={me.color || '#6366f1'} size={34} online={me.status === 'online'} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me.name || 'Agent'}</div>
              <div style={{ fontSize: 11, color: '#10b981' }}>● Online</div>
            </div>
          </div>
          <button onClick={() => navigate('/admin')} style={{
            width: '100%', padding: '8px', borderRadius: 10, border: 'none',
            background: 'rgba(255,255,255,0.04)', color: '#6b7280', fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>← Admin Panel</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: '#0f0f1e', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f3f4f6', flex: 1 }}>
            {tab === 'queue' ? '⏳ Escalation Queue' : tab === 'active' ? '💬 Active Chats' : tab === 'analytics' ? '📊 Analytics' : '👥 Agent Team'}
          </h1>
          <button onClick={load} style={{
            padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)', color: '#9ca3af', fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>↻ Refresh</button>
        </header>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {/* Analytics Tab */}
          {tab === 'analytics' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
                {statCards.map(c => (
                  <div key={c.label} style={{
                    background: '#12121e', border: `1px solid ${c.color}22`,
                    borderRadius: 16, padding: '20px 20px',
                    boxShadow: `0 4px 20px ${c.color}11`,
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{c.icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>{c.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#9ca3af' }}>Recent Escalations</h3>
                {[...queue, ...active].slice(0, 5).map(e => (
                  <div key={e.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ fontSize: 18 }}>
                      {e.priority === 'critical' ? '🔴' : e.priority === 'high' ? '🟠' : e.priority === 'normal' ? '🔵' : '🟢'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#f3f4f6', fontWeight: 500 }}>{e.user_name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{e.topic}</div>
                    </div>
                    <Badge status={e.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Tab */}
          {tab === 'agents' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
                {agents.map(ag => (
                  <div key={ag.id} style={{
                    background: '#12121e', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, padding: 20,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <AgentAvatar name={ag.name} color={ag.color} size={40} online={ag.status === 'online'} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f3f4f6' }}>{ag.name}</div>
                        <div style={{ fontSize: 11, color: ag.status === 'online' ? '#10b981' : ag.status === 'away' ? '#f59e0b' : '#6b7280' }}>
                          ● {ag.status}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Active Chats', value: ag.active_chats || 0 },
                        { label: 'Resolved', value: ag.resolved_today || 0 },
                      ].map(s => (
                        <div key={s.label} style={{
                          background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px',
                        }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#f3f4f6' }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Queue / Active Tabs */}
          {(tab === 'queue' || tab === 'active') && (
            <>
              {/* List */}
              <div style={{
                width: selEsc ? 340 : '100%', flexShrink: 0,
                overflowY: 'auto', borderRight: selEsc ? '1px solid rgba(255,255,255,0.06)' : 'none',
                padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                {(tab === 'queue' ? queue : active).length === 0 && (
                  <div style={{ textAlign: 'center', color: '#4b5563', marginTop: 60, fontSize: 14 }}>
                    {tab === 'queue' ? '✅ No pending escalations' : '💤 No active chats'}
                  </div>
                )}
                {(tab === 'queue' ? queue : active).map(e => (
                  <div key={e.id}
                    onClick={() => setSelected(selected === e.id ? null : e.id)}
                    style={{
                      background: selected === e.id ? 'rgba(99,102,241,0.1)' : '#12121e',
                      border: selected === e.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: PRIORITY_COLORS[e.priority] || '#6366f1',
                        boxShadow: `0 0 8px ${PRIORITY_COLORS[e.priority] || '#6366f1'}`,
                      }} />
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#f3f4f6' }}>{e.user_name}</span>
                      <Badge status={e.status} />
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
                      📌 {e.topic}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>
                      {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      &nbsp;·&nbsp;Priority: <strong style={{ color: PRIORITY_COLORS[e.priority], textTransform: 'capitalize' }}>{e.priority}</strong>
                    </div>
                    {tab === 'queue' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={ev => { ev.stopPropagation(); accept(e.id); }} style={{
                          flex: 1, padding: '8px', borderRadius: 10, border: 'none',
                          background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}>✓ Accept</button>
                        <button onClick={ev => { ev.stopPropagation(); reject(e.id); }} style={{
                          flex: 1, padding: '8px', borderRadius: 10,
                          border: '1px solid rgba(239,68,68,0.3)',
                          background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}>✕ Reject</button>
                      </div>
                    )}
                    {tab === 'active' && (
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {e.messages?.length || 0} messages • Click to open chat
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Chat detail */}
              {selEsc && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Chat header */}
                  <div style={{
                    padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: '#0f0f1e', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#f3f4f6' }}>{selEsc.user_name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{selEsc.topic}</div>
                    </div>
                    <Badge status={selEsc.status} />
                    <button onClick={() => setSelected(null)} style={{
                      width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)', color: '#9ca3af',
                      cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                  </div>

                  {/* AI Summary */}
                  <div style={{
                    margin: '12px 16px 0', padding: '10px 14px',
                    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 10, fontSize: 12, color: '#a5b4fc',
                  }}>
                    🤖 <strong>AI Summary:</strong> {selEsc.ai_summary}
                  </div>

                  {/* AI chat history */}
                  {selEsc.chat_history?.length > 0 && (
                    <details style={{ margin: '8px 16px 0' }}>
                      <summary style={{ fontSize: 12, color: '#6b7280', cursor: 'pointer', padding: '6px 0' }}>
                        📜 View AI conversation history ({selEsc.chat_history.length} messages)
                      </summary>
                      <div style={{
                        maxHeight: 150, overflowY: 'auto', marginTop: 8,
                        background: '#12121e', borderRadius: 10, padding: 12,
                        display: 'flex', flexDirection: 'column', gap: 6,
                      }}>
                        {selEsc.chat_history.map((m, i) => (
                          <div key={i} style={{
                            fontSize: 12, color: m.role === 'user' ? '#e5e7eb' : '#9ca3af',
                            padding: '4px 8px', borderRadius: 6,
                            background: m.role === 'user' ? 'rgba(99,102,241,0.1)' : 'transparent',
                          }}>
                            <strong style={{ color: m.role === 'user' ? '#a5b4fc' : '#6b7280' }}>
                              {m.role === 'user' ? 'User' : 'AI'}:
                            </strong> {m.content}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Live chat */}
                  <div style={{ flex: 1, overflow: 'hidden', marginTop: 8 }}>
                    {selEsc.status === 'active' ? (
                      <LiveChat esc={selEsc} agentId={agentId} onResolve={resolve} />
                    ) : (
                      <div style={{ padding: 20, color: '#6b7280', fontSize: 13, textAlign: 'center' }}>
                        {selEsc.status === 'waiting' ? 'Accept this chat to start messaging.' : 'Chat has ended.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
