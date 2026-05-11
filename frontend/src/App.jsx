import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatInterface from './ChatInterface';
import AdminPanel from './AdminPanel';
import AnalyticsDashboard from './AnalyticsDashboard';
import AgentPanel from './AgentPanel';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatInterface />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/agent-panel" element={<AgentPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
