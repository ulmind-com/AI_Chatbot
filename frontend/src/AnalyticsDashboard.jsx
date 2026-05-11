import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';

// ── Dummy Data ──
const dailyMsgs = [
  { day: 'Mon', messages: 420 }, { day: 'Tue', messages: 580 },
  { day: 'Wed', messages: 390 }, { day: 'Thu', messages: 720 },
  { day: 'Fri', messages: 860 }, { day: 'Sat', messages: 540 },
  { day: 'Sun', messages: 310 },
];
const weeklyUsers = [
  { week: 'W1', users: 120 }, { week: 'W2', users: 190 },
  { week: 'W3', users: 160 }, { week: 'W4', users: 240 },
];
const categories = [
  { name: 'General', value: 38 }, { name: 'Technical', value: 27 },
  { name: 'Billing', value: 18 }, { name: 'Feedback', value: 17 },
];
const aiGrowth = [
  { month: 'Jan', ai: 200 }, { month: 'Feb', ai: 340 },
  { month: 'Mar', ai: 480 }, { month: 'Apr', ai: 620 },
  { month: 'May', ai: 890 }, { month: 'Jun', ai: 1100 },
];
const trending = [
  { q: 'What are your business hours?', freq: 142, trend: '+18%' },
  { q: 'How do I reset my password?', freq: 128, trend: '+12%' },
  { q: 'What payment methods do you accept?', freq: 97, trend: '+8%' },
  { q: 'How to cancel subscription?', freq: 84, trend: '+22%' },
  { q: 'Contact support agent', freq: 76, trend: '+5%' },
  { q: 'Refund policy details', freq: 63, trend: '+15%' },
];
const chatTable = [
  { user: 'Rahul Sharma', msgs: 47, last: '2 min ago', topic: 'Billing', duration: '14m', sat: 94 },
  { user: 'Priya Das', msgs: 32, last: '8 min ago', topic: 'Technical', duration: '9m', sat: 88 },
  { user: 'Amit Roy', msgs: 61, last: '15 min ago', topic: 'General', duration: '22m', sat: 97 },
  { user: 'Sara Khan', msgs: 18, last: '23 min ago', topic: 'Feedback', duration: '6m', sat: 72 },
  { user: 'Dev Nair', msgs: 54, last: '31 min ago', topic: 'Technical', duration: '18m', sat: 91 },
  { user: 'Meera Joshi', msgs: 29, last: '45 min ago', topic: 'Billing', duration: '11m', sat: 85 },
];
const PIE_COLORS = ['#6366f1','#a855f7','#10b981','#f59e0b'];
const peakHours = [
  { h:'6am',v:12},{h:'8am',v:45},{h:'10am',v:89},{h:'12pm',v:134},
  {h:'2pm',v:112},{h:'4pm',v:98},{h:'6pm',v:76},{h:'8pm',v:54},{h:'10pm',v:28},
];

// ── Sidebar Nav ──
const NAV = [
  { id:'dashboard', label:'Dashboard', icon:'▦' },
  { id:'analytics', label:'Analytics', icon:'📈' },
  { id:'chat', label:'Chat History', icon:'💬' },
  { id:'users', label:'Users', icon:'👥' },
  { id:'trending', label:'Trending', icon:'🔥' },
  { id:'reports', label:'Reports', icon:'📄' },
  { id:'settings', label:'Settings', icon:'⚙️' },
];

function Sidebar({ active, setActive, collapsed, setCollapsed, navigate }) {
  const s = {
    sidebar: { width: collapsed ? 64 : 228, minWidth: collapsed ? 64 : 228, height:'100vh', background:'rgba(8,11,20,0.97)', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', transition:'width 0.3s cubic-bezier(0.4,0,0.2,1)', overflow:'hidden', flexShrink:0, backdropFilter:'blur(20px)' },
    logo: { padding: collapsed ? '20px 0' : '20px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,0.07)', marginBottom:8, justifyContent: collapsed ? 'center' : 'flex-start' },
    navItem: (id) => ({ display:'flex', alignItems:'center', gap:12, padding: collapsed ? '12px 0' : '11px 14px', justifyContent: collapsed ? 'center' : 'flex-start', margin:'2px 8px', borderRadius:12, cursor:'pointer', transition:'all 0.2s', background: active===id ? 'rgba(99,102,241,0.18)' : 'transparent', color: active===id ? '#818cf8' : 'rgba(148,163,184,0.65)', border: active===id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent', fontSize:13.5, fontWeight: active===id ? 700 : 500, boxShadow: active===id ? '0 0 20px rgba(99,102,241,0.08)' : 'none' }),
    backBtn: { display:'flex', alignItems:'center', gap:10, padding: collapsed ? '11px 0' : '11px 14px', justifyContent: collapsed ? 'center' : 'flex-start', margin:'2px 8px', borderRadius:12, cursor:'pointer', transition:'all 0.2s', background:'rgba(239,68,68,0.07)', color:'#f87171', border:'1px solid rgba(239,68,68,0.18)', fontSize:13.5, fontWeight:600 },
  };
  return (
    <aside style={s.sidebar}>
      {/* Logo */}
      <div style={s.logo}>
        <div style={{width:32,height:32,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 0 16px rgba(99,102,241,0.4)'}}>
          <span style={{fontSize:16}}>🤖</span>
        </div>
        {!collapsed && <span style={{color:'#f8fafc',fontWeight:800,fontSize:14.5,letterSpacing:'-0.02em'}}>Nova Analytics</span>}
      </div>

      {/* Collapse toggle */}
      <button onClick={()=>setCollapsed(!collapsed)} style={{margin:'0 auto 12px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(148,163,184,0.7)',borderRadius:8,width:32,height:24,cursor:'pointer',fontSize:10,transition:'all 0.2s'}}>
        {collapsed ? '▶' : '◀'}
      </button>

      {/* Nav items */}
      <nav style={{flex:1,overflowY:'auto',padding:'0 0 8px'}}>
        {NAV.map(n=>(
          <div key={n.id} style={s.navItem(n.id)}
            onClick={()=>setActive(n.id)}
            onMouseEnter={e=>{ if(active!==n.id){ e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='#e2e8f0'; }}}
            onMouseLeave={e=>{ if(active!==n.id){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(148,163,184,0.65)'; }}}
          >
            <span style={{fontSize:17,flexShrink:0}}>{n.icon}</span>
            {!collapsed && <span style={{flex:1}}>{n.label}</span>}
            {!collapsed && active===n.id && <span style={{width:6,height:6,borderRadius:'50%',background:'#818cf8',flexShrink:0}}/>}
          </div>
        ))}
      </nav>

      {/* Footer: Back to Knowledge Base */}
      <div style={{padding:'12px 8px 16px',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column',gap:8}}>
        {/* Admin badge */}
        <div style={{display:'flex',alignItems:'center',gap:10,padding: collapsed?'8px 0':'10px 10px',justifyContent:collapsed?'center':'flex-start',background:'rgba(255,255,255,0.03)',borderRadius:10}}>
          <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#6366f1,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff',flexShrink:0}}>A</div>
          {!collapsed && <div><div style={{fontSize:12,color:'#f8fafc',fontWeight:600}}>Administrator</div><div style={{fontSize:10,color:'#10b981',marginTop:1}}>● Active</div></div>}
        </div>
        {/* Back to Knowledge Base button */}
        <div style={s.backBtn}
          onClick={()=>navigate('/admin')}
          onMouseEnter={e=>{ e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.color='#fca5a5'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background='rgba(239,68,68,0.07)'; e.currentTarget.style.color='#f87171'; }}
        >
          <svg style={{width:15,height:15,flexShrink:0}} viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          {!collapsed && <span>Knowledge Base</span>}
        </div>
      </div>
    </aside>
  );
}

function StatCard({ icon, label, value, sub, color, live }) {
  return (
    <div style={{background:'rgba(15,17,28,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:20,padding:'22px 24px',flex:1,minWidth:160,position:'relative',overflow:'hidden',transition:'transform 0.2s,box-shadow 0.2s',cursor:'default'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,0.4)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}>
      <div style={{position:'absolute',top:0,right:0,width:80,height:80,background:`radial-gradient(circle,${color}20,transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <span style={{fontSize:24}}>{icon}</span>
        {live && <span style={{background:'rgba(16,185,129,0.12)',border:'1px solid rgba(16,185,129,0.25)',color:'#34d399',borderRadius:99,fontSize:10,fontWeight:700,padding:'2px 8px',display:'flex',alignItems:'center',gap:4}}><span style={{width:5,height:5,borderRadius:'50%',background:'#10b981',display:'inline-block'}}/>LIVE</span>}
      </div>
      <div style={{fontSize:28,fontWeight:800,color:'#f8fafc',letterSpacing:'-0.03em',marginBottom:4}}>{value}</div>
      <div style={{fontSize:12,color:'rgba(148,163,184,0.8)',fontWeight:600,marginBottom:6}}>{label}</div>
      {sub && <div style={{fontSize:11,color:color,fontWeight:700}}>{sub}</div>}
    </div>
  );
}

function ChartCard({ title, children, action }) {
  return (
    <div style={{background:'rgba(15,17,28,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:20,padding:'24px',flex:1}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h3 style={{fontSize:15,fontWeight:700,color:'#f8fafc',margin:0}}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

const TTP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'rgba(15,17,28,0.95)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:12,padding:'10px 14px'}}>
      <p style={{color:'#94a3b8',fontSize:12,margin:'0 0 4px'}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color,fontSize:14,fontWeight:700,margin:0}}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ── Section pages for non-dashboard nav items ──
function ComingSoonSection({ icon, title, description, features }) {
  return (
    <div style={{padding:'48px 32px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'70vh',textAlign:'center'}}>
      <div style={{width:80,height:80,borderRadius:24,background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,marginBottom:24,boxShadow:'0 0 40px rgba(99,102,241,0.15)'}}>{icon}</div>
      <h2 style={{fontSize:28,fontWeight:800,color:'#f8fafc',letterSpacing:'-0.03em',marginBottom:10}}>{title}</h2>
      <p style={{fontSize:15,color:'rgba(148,163,184,0.7)',maxWidth:420,lineHeight:1.7,marginBottom:36}}>{description}</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:12,justifyContent:'center',maxWidth:560}}>
        {features.map((f,i)=>(
          <div key={i} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'10px 18px',fontSize:13,color:'rgba(148,163,184,0.8)',display:'flex',alignItems:'center',gap:8}}>
            <span style={{color:'#818cf8'}}>✦</span>{f}
          </div>
        ))}
      </div>
      <div style={{marginTop:40,padding:'12px 28px',background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1))',border:'1px solid rgba(99,102,241,0.25)',borderRadius:99,fontSize:13,color:'#818cf8',fontWeight:700,letterSpacing:'0.04em'}}>🚀 COMING SOON</div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [liveCount, setLiveCount] = useState(247);
  const [activeSessions, setActiveSessions] = useState(38);
  const [dateFilter, setDateFilter] = useState('7d');
  const [search, setSearch] = useState('');

  useEffect(()=>{
    const t = setInterval(()=>{
      setLiveCount(v => v + Math.floor(Math.random()*3 - 0.5));
      setActiveSessions(v => Math.max(30, v + Math.floor(Math.random()*5 - 2)));
    }, 2500);
    return ()=>clearInterval(t);
  },[]);

  const filteredTrending = trending.filter(t=>t.q.toLowerCase().includes(search.toLowerCase()));

  const inputStyle = { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'8px 14px', color:'#f8fafc', fontSize:13, outline:'none', fontFamily:'inherit' };
  const pillStyle = (active, val) => ({ padding:'6px 14px', borderRadius:99, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', background: active===val ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', color: active===val ? '#818cf8' : 'rgba(148,163,184,0.7)', border: active===val ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)', transition:'all 0.2s' });

  const SECTION_TITLES = { dashboard:'Analytics Dashboard', analytics:'Deep Analytics', chat:'Chat History', users:'Users', trending:'Trending Questions', reports:'Reports', settings:'Settings' };
  const SECTION_SUBS   = { dashboard:'Real-time insights · Auto-refresh every 2.5s', analytics:'Advanced metrics and performance data', chat:'Full conversation logs and session details', users:'User management and activity overview', trending:'Most searched topics and keywords', reports:'Generate and export detailed reports', settings:'Configure dashboard preferences' };

  return (
    <div style={{display:'flex',width:'100vw',height:'100vh',background:'#080b14',fontFamily:"'Outfit','Inter',sans-serif",color:'#f8fafc',overflow:'hidden'}}>
      {/* Background orbs */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <div style={{position:'absolute',width:500,height:500,background:'radial-gradient(circle,rgba(99,102,241,0.1),transparent 70%)',top:-100,left:-100,borderRadius:'50%',filter:'blur(60px)'}}/>
        <div style={{position:'absolute',width:400,height:400,background:'radial-gradient(circle,rgba(168,85,247,0.08),transparent 70%)',bottom:-80,right:-80,borderRadius:'50%',filter:'blur(60px)'}}/>
      </div>

      <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} navigate={navigate}/>

      <main style={{flex:1,overflowY:'auto',position:'relative',zIndex:1,display:'flex',flexDirection:'column'}}>
        {/* Topbar */}
        <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 28px',background:'rgba(8,11,20,0.85)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)',position:'sticky',top:0,zIndex:50,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:38,height:38,borderRadius:12,background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
              {NAV.find(n=>n.id===active)?.icon}
            </div>
            <div>
              <h1 style={{fontSize:18,fontWeight:800,margin:0,letterSpacing:'-0.03em'}}>{SECTION_TITLES[active]}</h1>
              <p style={{fontSize:11.5,color:'rgba(148,163,184,0.6)',margin:0,marginTop:1}}>{SECTION_SUBS[active]}</p>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {active==='dashboard' && ['7d','30d','90d'].map(v=>(
              <button key={v} style={pillStyle(dateFilter,v)} onClick={()=>setDateFilter(v)}>{v}</button>
            ))}
            {active==='dashboard' && (
              <button style={{...inputStyle,cursor:'pointer',display:'flex',alignItems:'center',gap:6,padding:'8px 16px'}} onClick={()=>{
                const csv = ['User,Messages,Last Active,Topic,Duration,Satisfaction',...chatTable.map(r=>`${r.user},${r.msgs},${r.last},${r.topic},${r.duration},${r.sat}%`)].join('\n');
                const a=document.createElement('a'); a.href='data:text/csv,'+encodeURIComponent(csv); a.download='analytics.csv'; a.click();
              }}>
                <span>📥</span> Export CSV
              </button>
            )}
            <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:99,padding:'6px 12px'}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:'#10b981',display:'inline-block',animation:'pulse 2s infinite'}}></span>
              <span style={{fontSize:11.5,color:'#34d399',fontWeight:700}}>Live</span>
            </div>
          </div>
        </header>

        {/* ── Section Router ── */}
        {active === 'analytics' && <ComingSoonSection icon="📈" title="Deep Analytics" description="Advanced performance metrics, cohort analysis, funnel tracking, and custom report builder — all in one place." features={['Cohort Analysis','Funnel Tracking','Custom Metrics','A/B Testing','Heatmaps','Retention Curves']}/>}
        {active === 'chat' && <ComingSoonSection icon="💬" title="Chat History" description="Browse all conversations with full transcript, filters by user, date, topic, and satisfaction score." features={['Full Transcripts','Search & Filter','Export Logs','Session Replay','Tag Conversations','Bulk Actions']}/>}
        {active === 'users' && <ComingSoonSection icon="👥" title="User Management" description="View and manage all users, their activity, roles, permissions, and engagement history." features={['User Profiles','Role Management','Activity Timeline','Engagement Score','Bulk Messaging','Ban & Restrict']}/>}
        {active === 'trending' && (
          <div style={{padding:'28px',display:'flex',flexDirection:'column',gap:24}}>
            <div style={{background:'rgba(15,17,28,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:20,padding:28}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:12}}>
                <div><h3 style={{fontSize:17,fontWeight:800,margin:0,letterSpacing:'-0.02em'}}>🔥 Trending Questions</h3><p style={{fontSize:12,color:'rgba(148,163,184,0.6)',margin:'4px 0 0'}}>Last 7 days · Updated in real-time</p></div>
                <input style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'8px 14px',color:'#f8fafc',fontSize:13,outline:'none',fontFamily:'inherit',width:220}} placeholder="Search questions..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {filteredTrending.map((t,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,transition:'all 0.2s',cursor:'pointer'}}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(99,102,241,0.08)';e.currentTarget.style.borderColor='rgba(99,102,241,0.22)';e.currentTarget.style.transform='translateX(4px)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.025)';e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.style.transform='none';}}>
                    <span style={{width:32,height:32,borderRadius:10,background: i<3?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.06)',color: i<3?'#818cf8':'rgba(148,163,184,0.7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,flexShrink:0}}>#{i+1}</span>
                    <span style={{flex:1,fontSize:14,color:'rgba(248,250,252,0.9)',fontWeight:500}}>{t.q}</span>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                      <span style={{fontSize:13,color:'rgba(148,163,184,0.8)',fontWeight:700}}>{t.freq} searches</span>
                      <span style={{background:'rgba(16,185,129,0.12)',color:'#34d399',border:'1px solid rgba(16,185,129,0.2)',borderRadius:99,padding:'2px 10px',fontSize:11,fontWeight:700}}>{t.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {active === 'reports' && <ComingSoonSection icon="📄" title="Reports Center" description="Generate detailed PDF and CSV reports for messages, users, AI performance, and satisfaction scores on demand." features={['PDF Export','CSV Export','Scheduled Reports','Custom Date Range','Email Delivery','Report Templates']}/>}
        {active === 'settings' && <ComingSoonSection icon="⚙️" title="Dashboard Settings" description="Customize your analytics dashboard — set refresh intervals, notification preferences, theme, and data retention policies." features={['Dark/Light Mode','Refresh Rate','Notifications','Data Retention','API Keys','Webhooks']}/>}

        {/* ── Dashboard Main Content ── */}
        {active === 'dashboard' && <div style={{padding:'28px',display:'flex',flexDirection:'column',gap:24}}>

          {/* Stat Cards */}
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            <StatCard icon="👥" label="Total Users" value="2,847" sub="↑ 12.4% this month" color="#6366f1"/>
            <StatCard icon="💬" label="Total Messages" value={liveCount.toLocaleString()} sub="Live count" color="#a855f7" live/>
            <StatCard icon="⚡" label="Active Chats" value={activeSessions} sub="Right now" color="#10b981" live/>
            <StatCard icon="🤖" label="AI Responses" value="18,492" sub="↑ 28.7% this week" color="#f59e0b"/>
            <StatCard icon="📅" label="Today's Messages" value="1,284" sub="↑ 9.2% vs yesterday" color="#ec4899"/>
            <StatCard icon="📈" label="Monthly Growth" value="34.6%" sub="Compared to last month" color="#06b6d4"/>
          </div>

          {/* Charts Row 1 */}
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            <div style={{flex:'1 1 55%',minWidth:300}}>
              <ChartCard title="📊 Daily Messages (This Week)">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyMsgs}>
                    <defs>
                      <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="day" tick={{fill:'#64748b',fontSize:12}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#64748b',fontSize:12}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<TTP/>}/>
                    <Area type="monotone" dataKey="messages" stroke="#6366f1" strokeWidth={2.5} fill="url(#msgGrad)" dot={{fill:'#6366f1',r:4}} activeDot={{r:6}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div style={{flex:'1 1 40%',minWidth:260}}>
              <ChartCard title="🥧 Message Categories">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categories} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                      {categories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="none"/>)}
                    </Pie>
                    <Tooltip content={<TTP/>}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12,color:'#94a3b8'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            <div style={{flex:'1 1 45%',minWidth:260}}>
              <ChartCard title="👥 Weekly Active Users">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyUsers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="week" tick={{fill:'#64748b',fontSize:12}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#64748b',fontSize:12}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<TTP/>}/>
                    <Bar dataKey="users" fill="url(#barGrad)" radius={[6,6,0,0]}>
                      <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7"/><stop offset="100%" stopColor="#6366f1"/></linearGradient></defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div style={{flex:'1 1 45%',minWidth:260}}>
              <ChartCard title="🤖 AI Usage Growth">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={aiGrowth}>
                    <defs>
                      <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:12}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#64748b',fontSize:12}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<TTP/>}/>
                    <Area type="monotone" dataKey="ai" stroke="#10b981" strokeWidth={2.5} fill="url(#aiGrad)" dot={{fill:'#10b981',r:4}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>

          {/* Peak Hours */}
          <ChartCard title="⏰ Peak Usage Hours">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="h" tick={{fill:'#64748b',fontSize:12}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#64748b',fontSize:12}} axisLine={false} tickLine={false}/>
                <Tooltip content={<TTP/>}/>
                <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2.5} dot={{fill:'#f59e0b',r:4}} name="Sessions"/>
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Trending Questions */}
          <div style={{background:'rgba(15,17,28,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:20,padding:24}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
              <h3 style={{fontSize:15,fontWeight:700,margin:0}}>🔥 Trending Questions (Last 7 Days)</h3>
              <input style={inputStyle} placeholder="Search questions..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {filteredTrending.map((t,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 18px',background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,transition:'all 0.2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(99,102,241,0.08)';e.currentTarget.style.borderColor='rgba(99,102,241,0.2)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.025)';e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';}}>
                  <span style={{width:28,height:28,borderRadius:8,background:'rgba(99,102,241,0.15)',color:'#818cf8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>#{i+1}</span>
                  <span style={{flex:1,fontSize:14,color:'rgba(248,250,252,0.9)'}}>{t.q}</span>
                  <span style={{fontSize:13,color:'rgba(148,163,184,0.7)',fontWeight:600,flexShrink:0}}>{t.freq} searches</span>
                  <span style={{background:'rgba(16,185,129,0.12)',color:'#34d399',border:'1px solid rgba(16,185,129,0.2)',borderRadius:99,padding:'3px 10px',fontSize:11,fontWeight:700,flexShrink:0}}>{t.trend}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Analytics Table */}
          <div style={{background:'rgba(15,17,28,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:20,padding:24}}>
            <h3 style={{fontSize:15,fontWeight:700,margin:'0 0 20px'}}>👤 Chat Analytics — Recent Sessions</h3>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr>
                    {['User','Messages','Last Active','Topic','Duration','Satisfaction'].map(h=>(
                      <th key={h} style={{padding:'10px 14px',textAlign:'left',color:'rgba(148,163,184,0.6)',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chatTable.map((r,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',transition:'background 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{padding:'14px'}}><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:30,height:30,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{r.user[0]}</div><span style={{color:'#f8fafc',fontWeight:600}}>{r.user}</span></div></td>
                      <td style={{padding:'14px',color:'#a78bfa',fontWeight:700}}>{r.msgs}</td>
                      <td style={{padding:'14px',color:'rgba(148,163,184,0.7)'}}>{r.last}</td>
                      <td style={{padding:'14px'}}><span style={{background:'rgba(99,102,241,0.12)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.2)',borderRadius:99,padding:'3px 10px',fontSize:11,fontWeight:700}}>{r.topic}</span></td>
                      <td style={{padding:'14px',color:'rgba(148,163,184,0.8)'}}>{r.duration}</td>
                      <td style={{padding:'14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{flex:1,height:5,background:'rgba(255,255,255,0.08)',borderRadius:99,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${r.sat}%`,background: r.sat>=90?'#10b981':r.sat>=75?'#f59e0b':'#ef4444',borderRadius:99,transition:'width 0.5s'}}/>
                          </div>
                          <span style={{fontSize:12,fontWeight:700,color: r.sat>=90?'#34d399':r.sat>=75?'#fbbf24':'#f87171',flexShrink:0}}>{r.sat}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>}
      </main>
    </div>
  );
}
