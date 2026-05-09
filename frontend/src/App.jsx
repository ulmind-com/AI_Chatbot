import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatInterface from './ChatInterface';
import AdminPanel from './AdminPanel';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatInterface />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
