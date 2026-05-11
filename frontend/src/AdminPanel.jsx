import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
  const [knowledge, setKnowledge] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('add');
  const [notification, setNotification] = useState(null);
  const emailRef = useRef(null);

  useEffect(() => {
    document.title = 'Admin Panel | ULMIND AI';
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      fetchKnowledge();
    } else {
      // Always clear fields when landing on login
      setEmail('');
      setPassword('');
    }

    // No cleanup needed — token stays in sessionStorage for the full browser session.
  }, []);

  useEffect(() => {
    if (!isAuthenticated && emailRef.current) {
      setTimeout(() => emailRef.current?.focus(), 400);
    }
  }, [isAuthenticated]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        sessionStorage.setItem('adminToken', data.token);
        setLoginSuccess(true);
        // Clear sensitive fields IMMEDIATELY after successful login
        setEmail('');
        setPassword('');
        setTimeout(() => {
          setIsAuthenticated(true);
          setLoginSuccess(false);
          fetchKnowledge();
        }, 800);
      } else {
        setLoginError(data.detail || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      setLoginError('Cannot connect to server. Please try again.');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    // Securely clear everything
    sessionStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setKnowledge([]);
    setQuestion('');
    setAnswer('');
    setEmail('');
    setPassword('');
    setLoginError('');
    setLoginSuccess(false);
    setActiveTab('add');
  };

  const fetchKnowledge = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/knowledge`);
      const data = await res.json();
      setKnowledge(data);
    } catch (error) {
      console.error('Failed to fetch knowledge base', error);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question, answer })
      });
      if (res.ok) {
        setQuestion('');
        setAnswer('');
        fetchKnowledge();
        showNotification('Knowledge added successfully!');
        setActiveTab('list');
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (error) {
      showNotification('Failed to add knowledge.', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/knowledge/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchKnowledge();
        showNotification('Entry deleted successfully.');
        setDeleteConfirm(null);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (error) {
      showNotification('Failed to delete entry.', 'error');
    }
  };

  /* ── LOGIN PAGE ── */
  if (!isAuthenticated) {
    return (
      <div className="ap-root">
        {/* Animated background orbs */}
        <div className="ap-orb ap-orb-1" />
        <div className="ap-orb ap-orb-2" />
        <div className="ap-orb ap-orb-3" />

        <div className={`ap-login-card ${loginSuccess ? 'ap-login-success' : ''}`}>
          {/* Back button */}
          <button className="ap-back-pill" onClick={() => navigate('/')} title="Back to Chat">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            <span>Back</span>
          </button>

          {/* Shield logo */}
          <div className="ap-login-logo">
            <div className="ap-shield-ring">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="url(#shieldGrad)"/>
                <path d="M10 15l-3-3 1.41-1.41L10 12.17l5.59-5.58L17 8l-7 7z" fill="white"/>
                <defs>
                  <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div className="ap-login-title">
            <h1>Admin Access</h1>
            <p>Secure Bot Training Center</p>
          </div>

          <form className="ap-login-form" onSubmit={handleLogin} autoComplete="off">
            {loginError && (
              <div className="ap-alert ap-alert-error">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                {loginError}
              </div>
            )}

            <div className="ap-field">
              <label>Email Address</label>
              <div className="ap-input-wrap">
                <svg className="ap-field-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  autoComplete="new-email"
                  required
                />
              </div>
            </div>

            <div className="ap-field">
              <label>Password</label>
              <div className="ap-input-wrap">
                <svg className="ap-field-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  required
                />
                <button type="button" className="ap-eye-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  {showPassword
                    ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
                    : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`ap-login-btn ${isLoggingIn ? 'ap-loading' : ''} ${loginSuccess ? 'ap-btn-success' : ''}`}
              disabled={isLoggingIn || loginSuccess}
            >
              {loginSuccess
                ? <><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Access Granted</>
                : isLoggingIn
                  ? <><span className="ap-spinner"/><span>Authenticating...</span></>
                  : <><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>Secure Login</>
              }
            </button>
          </form>

          <p className="ap-login-footer">Protected Area · Authorized Personnel Only</p>
        </div>
      </div>
    );
  }

  /* ── ADMIN DASHBOARD ── */
  return (
    <div className="ap-root">
      <div className="ap-orb ap-orb-1" />
      <div className="ap-orb ap-orb-2" />
      <div className="ap-orb ap-orb-3" />

      {/* Notification Toast */}
      {notification && (
        <div className={`ap-toast ${notification.type === 'error' ? 'ap-toast-error' : 'ap-toast-success'}`}>
          {notification.type === 'error'
            ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
          }
          {notification.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="ap-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <div className="ap-modal-icon">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </div>
            <h3>Delete Entry?</h3>
            <p>This action is permanent and cannot be undone.</p>
            <div className="ap-modal-actions">
              <button className="ap-modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="ap-modal-delete" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="ap-dashboard">
        {/* ── SIDEBAR ── */}
        <aside className="ap-sidebar">
          <div className="ap-sidebar-logo">
            <div className="ap-sidebar-shield">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="url(#sideGrad)"/>
                <path d="M10 15l-3-3 1.41-1.41L10 12.17l5.59-5.58L17 8l-7 7z" fill="white"/>
                <defs>
                  <linearGradient id="sideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <span className="ap-sidebar-title">Bot Training</span>
              <span className="ap-sidebar-sub">Admin Center</span>
            </div>
          </div>

          <nav className="ap-sidebar-nav">
            <button
              className={`ap-nav-item ${activeTab === 'add' ? 'ap-nav-active' : ''}`}
              onClick={() => setActiveTab('add')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              <span>Add Knowledge</span>
            </button>
            <button
              className={`ap-nav-item ${activeTab === 'list' ? 'ap-nav-active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></svg>
              <span>Knowledge Base</span>
              {knowledge.length > 0 && <span className="ap-badge">{knowledge.length}</span>}
            </button>
            <button
              className="ap-nav-item"
              onClick={() => navigate('/analytics')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
              <span>Analytics</span>
              <span className="ap-badge" style={{background:'rgba(16,185,129,0.15)',color:'#10b981',border:'1px solid rgba(16,185,129,0.25)'}}>NEW</span>
            </button>
            <button
              className="ap-nav-item"
              onClick={() => navigate('/agent-panel')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 12H7v-2h10v2zm0-3H7V9h10v2zm0-3H7V6h10v2z"/></svg>
              <span>Agent Panel</span>
              <span className="ap-badge" style={{background:'rgba(245,158,11,0.15)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.25)'}}>LIVE</span>
            </button>
          </nav>

          <div className="ap-sidebar-footer">
            <div className="ap-admin-badge">
              <div className="ap-admin-avatar">A</div>
              <div className="ap-admin-info">
                <span>Administrator</span>
                <span className="ap-online-dot">● Online</span>
              </div>
            </div>
            <button className="ap-logout-btn" onClick={handleLogout} title="Sign Out">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="ap-main">
          {/* Header bar */}
          <header className="ap-topbar">
            <div className="ap-topbar-left">
              <button className="ap-back-icon" onClick={() => { handleLogout(); navigate('/'); }} title="Back to Chat">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              </button>
              <div>
                <h1>{activeTab === 'add' ? 'Add New Knowledge' : 'Knowledge Base'}</h1>
                <p>{activeTab === 'add' ? 'Train the AI with custom Q&A pairs' : `${knowledge.length} entries in the database`}</p>
              </div>
            </div>
            <div className="ap-topbar-right">
              <div className="ap-status-pill">
                <span className="ap-pulse-dot" />
                System Active
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="ap-content-area">
            {activeTab === 'add' && (
              <div className="ap-add-panel">
                <form onSubmit={handleAdd} className="ap-kb-form">
                  <div className="ap-form-section">
                    <div className="ap-form-section-header">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6.5l-4-4-9.5 9.5-2 5.5 5.5-2L21 6.5zM5 17l-1 3 3-1-2-2z"/></svg>
                      <span>Question / Intent</span>
                    </div>
                    <input
                      type="text"
                      className="ap-input"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="e.g. What are your business hours?"
                      required
                    />
                  </div>

                  <div className="ap-form-section">
                    <div className="ap-form-section-header">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                      <span>Bot's Answer</span>
                    </div>
                    <textarea
                      className="ap-textarea"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="e.g. We are open Monday to Friday, 9AM to 5PM IST."
                      required
                    />
                  </div>

                  <button type="submit" className={`ap-submit-btn ${loading ? 'ap-loading' : ''}`} disabled={loading}>
                    {loading
                      ? <><span className="ap-spinner"/><span>Adding...</span></>
                      : <><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg><span>Add to Knowledge Base</span></>
                    }
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'list' && (
              <div className="ap-list-panel">
                {knowledge.length === 0 ? (
                  <div className="ap-empty-state">
                    <div className="ap-empty-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25S13.24 11.25 12 11.25 9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-.75c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/></svg>
                    </div>
                    <h3>No Knowledge Yet</h3>
                    <p>The bot will use general AI responses. Add custom Q&A pairs to personalize its behavior.</p>
                    <button className="ap-empty-cta" onClick={() => setActiveTab('add')}>
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                      Add First Entry
                    </button>
                  </div>
                ) : (
                  <div className="ap-kb-grid">
                    {knowledge.map((item, i) => (
                      <div key={item._id} className="ap-kb-card" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="ap-kb-card-index">#{i + 1}</div>
                        <div className="ap-kb-card-body">
                          <div className="ap-kb-q">
                            <span className="ap-q-label">Q</span>
                            <p>{item.question}</p>
                          </div>
                          <div className="ap-kb-a">
                            <span className="ap-a-label">A</span>
                            <p>{item.answer}</p>
                          </div>
                        </div>
                        <button
                          className="ap-delete-btn"
                          onClick={() => setDeleteConfirm(item._id)}
                          title="Delete this entry"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;
