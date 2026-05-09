import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Connect to WebSocket server
    const ws = new WebSocket('ws://localhost:8000/ws/chat');
    
    ws.onopen = () => {
      console.log('Connected to chat server');
    };

    ws.onmessage = (event) => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: 'assistant', content: event.data }]);
    };

    ws.onclose = () => {
      console.log('Disconnected from chat server');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '' || !socket) return;

    // Add user message to UI
    setMessages((prev) => [...prev, { role: 'user', content: inputValue }]);
    setIsTyping(true);
    
    // Send to backend
    socket.send(inputValue);
    setInputValue('');
  };

  return (
    <div className="app-container">
      <div className="chat-wrapper">
        
        {/* Header */}
        <header className="chat-header">
          <div className="header-info">
            <div className="avatar-container">
              <div className="bot-avatar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                  <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM15 13.5H9V10.5H15V13.5Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="online-indicator"></div>
            </div>
            <div className="header-text">
              <h1>Nova AI Support</h1>
              <p>Online & ready to help</p>
            </div>
          </div>
          <button className="options-btn" onClick={() => navigate('/admin')} title="Admin Panel">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" fill="currentColor"/>
            </svg>
          </button>
        </header>

        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✨</div>
              <h2>How can I help you today?</h2>
              <p>Ask me anything about our services, pricing, or support.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`message-row ${msg.role === 'user' ? 'row-user' : 'row-bot'}`}
              >
                {msg.role !== 'user' && (
                  <div className="message-avatar bot-avatar-small">
                    N
                  </div>
                )}
                <div className={`message-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="message-row row-bot">
              <div className="message-avatar bot-avatar-small">N</div>
              <div className="message-bubble bubble-bot typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          <form onSubmit={sendMessage} className="input-form">
            <div className="input-wrapper">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message Nova..."
                className="chat-input"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim()}
                className="send-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </form>
          <div className="footer-text">Nova AI may produce inaccurate information.</div>
        </div>
        
      </div>
    </div>
  );
}

export default ChatInterface;
