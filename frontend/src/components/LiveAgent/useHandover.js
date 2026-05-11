/**
 * useHandover — Custom hook for Live Agent Handover
 * Handles: intent detection, escalation state, WebSocket to backend,
 *          user ↔ agent real-time messaging, frustration scoring
 */
import { useState, useEffect, useRef, useCallback } from 'react';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/agent`;
const WS_BASE = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/api/agent/ws/user`;

/* ── Intent detection keywords ─────────────────────────────── */
const INTENT_PATTERNS = [
  /\b(speak|talk|chat)\s*(to|with)?\s*(a\s*)?(human|person|agent|representative|rep)\b/i,
  /\b(live\s*agent|real\s*agent|human\s*agent|human\s*support)\b/i,
  /\b(customer\s*support|customer\s*service|support\s*team)\b/i,
  /\b(need\s*(human|help|agent|support)|want\s*(human|agent))\b/i,
  /\b(connect\s*(me\s*)?(to|with)\s*(support|agent|human))\b/i,
  /\b(human\s*please|please\s*human|get\s*me\s*(a\s*)?(human|agent))\b/i,
  /\b(escalate|transfer\s*me|transfer\s*to\s*agent)\b/i,
];

const FRUSTRATION_PATTERNS = [
  /\b(useless|stupid|terrible|awful|worst|hate|angry|frustrated|annoyed)\b/i,
  /\b(not\s*working|doesn'?t\s*work|broken|wrong|incorrect|bad)\b/i,
  /\b(refund|payment|charge|money|billing|invoice)\b/i,
  /\b(urgent|emergency|critical|asap|immediately)\b/i,
  /!{2,}|\?{2,}/,  // multiple !! or ??
];

const SENSITIVE_PATTERNS = [
  /\b(refund|chargeback|dispute|fraud|scam|stolen|hacked)\b/i,
  /\b(cancel\s*(my\s*)?(account|subscription|order))\b/i,
  /\b(legal|lawsuit|sue|complaint|complaint)\b/i,
];

export function detectHandoverIntent(text) {
  const hasIntent = INTENT_PATTERNS.some(p => p.test(text));
  const hasFrustration = FRUSTRATION_PATTERNS.some(p => p.test(text));
  const isSensitive = SENSITIVE_PATTERNS.some(p => p.test(text));
  let score = 0;
  if (hasIntent) score += 90;
  if (hasFrustration) score += 30;
  if (isSensitive) score += 40;
  return {
    shouldEscalate: hasIntent || score >= 70,
    score: Math.min(score, 100),
    reason: hasIntent ? 'human_requested'
           : isSensitive ? 'sensitive_topic'
           : hasFrustration ? 'frustration_detected'
           : 'low_confidence',
  };
}

/* ── Hook ──────────────────────────────────────────────────── */
export default function useHandover(messages = []) {
  const [state, setState] = useState({
    showModal: false,
    isEscalated: false,
    isConnected: false,
    escalation: null,
    agentMessages: [],
    agentInfo: null,
    waitTime: null,
    status: 'idle', // idle | waiting | active | resolved | rejected
    triggerReason: null,
  });

  const wsRef = useRef(null);
  const sessionId = useRef(`user-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const frustrationCount = useRef(0);
  const failedAiCount = useRef(0);

  /* Track frustration & repeated asks across message history */
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last?.role !== 'user') return;

    const { shouldEscalate, reason } = detectHandoverIntent(last.content || '');

    // Count repeated human requests
    const humanAskCount = messages.filter(m =>
      m.role === 'user' && INTENT_PATTERNS.some(p => p.test(m.content || ''))
    ).length;

    if (humanAskCount >= 2 && !state.isEscalated) {
      setState(s => ({ ...s, showModal: true, triggerReason: 'repeated_request' }));
      return;
    }

    if (shouldEscalate && !state.isEscalated) {
      setState(s => ({ ...s, showModal: true, triggerReason: reason }));
    }
  }, [messages]);

  /* Connect user WebSocket */
  const connectUserWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(`${WS_BASE}/${sessionId.current}`);
    ws.onopen = () => { wsRef.current = ws; };
    ws.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      handleServerEvent(payload);
    };
    ws.onclose = () => setTimeout(connectUserWS, 3000);
    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connectUserWS();
    return () => wsRef.current?.close();
  }, [connectUserWS]);

  function handleServerEvent(payload) {
    switch (payload.type) {
      case 'agent_joined':
        setState(s => ({
          ...s,
          status: 'active',
          isConnected: true,
          agentInfo: { id: payload.agent_id, name: payload.agent_name },
          escalation: { ...s.escalation, id: payload.escalation_id },
          agentMessages: [...s.agentMessages, {
            from: 'agent', text: payload.message,
            timestamp: new Date().toISOString(), id: Date.now(),
          }],
        }));
        playNotificationSound();
        break;
      case 'agent_message':
        setState(s => ({
          ...s,
          agentMessages: [...s.agentMessages, {
            from: 'agent',
            text: payload.message.text,
            timestamp: payload.message.timestamp,
            id: payload.message.id,
          }],
        }));
        playNotificationSound();
        break;
      case 'escalation_rejected':
        setState(s => ({ ...s, status: 'rejected' }));
        break;
      case 'chat_resolved':
        setState(s => ({
          ...s, status: 'resolved',
          agentMessages: [...s.agentMessages, {
            from: 'system', text: payload.message,
            timestamp: new Date().toISOString(), id: Date.now(),
          }],
        }));
        break;
    }
  }

  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  }

  /* Trigger escalation → call API */
  const triggerEscalation = useCallback(async (opts = {}) => {
    setState(s => ({ ...s, status: 'waiting', showModal: false, isEscalated: true }));

    const chatHistory = messages.slice(-10).map(m => ({
      role: m.role, content: m.content || '',
    }));

    const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0];
    const topic = opts.topic || lastUserMsg?.content?.slice(0, 60) || 'General Support';
    const priority = opts.priority || 'normal';

    try {
      const res = await fetch(`${API}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId.current,
          user_name: opts.userName || 'Anonymous User',
          chat_history: chatHistory,
          topic,
          priority,
          reason: state.triggerReason || 'user_requested',
        }),
      });
      const data = await res.json();
      setState(s => ({
        ...s,
        escalation: data.escalation,
        status: data.escalation.status === 'active' ? 'active' : 'waiting',
        waitTime: '2-5 min',
      }));
    } catch (err) {
      console.error('Escalation failed', err);
    }
  }, [messages, state.triggerReason]);

  /* Send message from user to agent */
  const sendUserMessage = useCallback(async (text) => {
    if (!text.trim() || !state.escalation?.id) return;
    const msg = { from: 'user', text, timestamp: new Date().toISOString(), id: Date.now() };
    setState(s => ({ ...s, agentMessages: [...s.agentMessages, msg] }));

    try {
      await fetch(`${API}/message/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalation_id: state.escalation.id,
          session_id: sessionId.current,
          text,
        }),
      });
    } catch (_) {}
  }, [state.escalation]);

  const dismissModal = useCallback(() => {
    setState(s => ({ ...s, showModal: false }));
  }, []);

  const openModal = useCallback(() => {
    setState(s => ({ ...s, showModal: true }));
  }, []);

  return {
    ...state,
    sessionId: sessionId.current,
    triggerEscalation,
    sendUserMessage,
    dismissModal,
    openModal,
  };
}
