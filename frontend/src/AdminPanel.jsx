import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
  const [knowledge, setKnowledge] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      fetchKnowledge();
    }
    
    // Auto-logout when leaving the admin panel
    return () => {
      localStorage.removeItem('adminToken');
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        fetchKnowledge();
      } else {
        setLoginError(data.detail || 'Invalid login credentials');
      }
    } catch (error) {
      setLoginError('Server error. Please try again.');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  const fetchKnowledge = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/knowledge');
      const data = await res.json();
      setKnowledge(data);
    } catch (error) {
      console.error("Failed to fetch knowledge base", error);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:8000/api/knowledge', {
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
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error("Failed to add knowledge", error);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:8000/api/knowledge/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchKnowledge();
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error("Failed to delete knowledge", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="login-wrapper">
          <button className="back-btn login-back" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
            </svg>
          </button>
          
          <div className="login-header">
            <div className="login-icon">🔒</div>
            <h2>Admin Login</h2>
            <p>Access the Bot Training Center</p>
          </div>
          
          <form className="login-form" onSubmit={handleLogin}>
            {loginError && <div className="error-message">{loginError}</div>}
            
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="admin@company.com"
                required 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
            
            <button type="submit" className="submit-btn" disabled={isLoggingIn}>
              {isLoggingIn ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="admin-wrapper">
        <header className="admin-header">
          <div className="header-info">
            <button className="back-btn" onClick={() => { handleLogout(); navigate('/'); }} title="Back to Chat">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
              </svg>
            </button>
            <div className="header-text">
              <h1>Bot Training Center</h1>
              <p>Manage AI Knowledge Base</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </header>

        <div className="admin-content">
          <div className="add-kb-section">
            <h2>Add New Knowledge</h2>
            <form onSubmit={handleAdd} className="kb-form">
              <div className="form-group">
                <label>Question / Intent</label>
                <input 
                  type="text" 
                  value={question} 
                  onChange={(e) => setQuestion(e.target.value)} 
                  placeholder="e.g. What are your business hours?"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Bot's Answer</label>
                <textarea 
                  value={answer} 
                  onChange={(e) => setAnswer(e.target.value)} 
                  placeholder="e.g. We are open Monday to Friday, 9AM to 5PM."
                  required 
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Adding...' : 'Add Knowledge'}
              </button>
            </form>
          </div>

          <div className="kb-list-section">
            <h2>Trained Knowledge ({knowledge.length})</h2>
            {knowledge.length === 0 ? (
              <div className="empty-kb">
                <p>No knowledge added yet. The bot will use general AI responses.</p>
              </div>
            ) : (
              <div className="kb-list">
                {knowledge.map((item) => (
                  <div key={item._id} className="kb-card">
                    <div className="kb-card-content">
                      <div className="kb-q"><strong>Q:</strong> {item.question}</div>
                      <div className="kb-a"><strong>A:</strong> {item.answer}</div>
                    </div>
                    <button className="delete-btn" onClick={() => handleDelete(item._id)} title="Delete Knowledge">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
