"""
Live Agent Handover Service
In-memory state management for escalations, agent queues, and live chat sessions.
"""
import uuid
from datetime import datetime
from typing import Dict, List, Optional

# ── In-memory stores ──────────────────────────────────────────────
escalation_queue: List[dict] = []          # Pending escalations waiting for agent
active_sessions: Dict[str, dict] = {}     # session_id → session data
agents: Dict[str, dict] = {}              # agent_id → agent data
agent_connections: Dict[str, object] = {} # agent_id → WebSocket
user_connections: Dict[str, object] = {}  # session_id → WebSocket

# ── Dummy agents seeded on startup ───────────────────────────────
def seed_agents():
    dummy = [
        {"id": "agent-001", "name": "Priya Sharma",    "email": "priya@support.com",  "avatar": "PS", "status": "online",  "color": "#6366f1"},
        {"id": "agent-002", "name": "Rahul Das",       "email": "rahul@support.com",  "avatar": "RD", "status": "online",  "color": "#10b981"},
        {"id": "agent-003", "name": "Sneha Patel",     "email": "sneha@support.com",  "avatar": "SP", "status": "away",    "color": "#f59e0b"},
        {"id": "agent-004", "name": "Arjun Mehta",     "email": "arjun@support.com",  "avatar": "AM", "status": "offline", "color": "#ef4444"},
    ]
    for a in dummy:
        agents[a["id"]] = {**a, "active_chats": 0, "resolved_today": 0, "avg_response_time": 0}

seed_agents()

# ── Helpers ───────────────────────────────────────────────────────
def get_available_agent() -> Optional[str]:
    for aid, agent in agents.items():
        if agent["status"] == "online" and agent["active_chats"] < 3:
            return aid
    return None

def create_escalation(session_id: str, user_name: str, chat_history: list,
                       topic: str, priority: str = "normal", reason: str = "") -> dict:
    esc_id = str(uuid.uuid4())
    esc = {
        "id": esc_id,
        "session_id": session_id,
        "user_name": user_name,
        "chat_history": chat_history[-10:],  # last 10 messages
        "topic": topic,
        "priority": priority,
        "reason": reason,
        "status": "waiting",  # waiting | active | resolved | rejected
        "agent_id": None,
        "created_at": datetime.utcnow().isoformat(),
        "accepted_at": None,
        "resolved_at": None,
        "wait_time_seconds": 0,
        "messages": [],  # live agent ↔ user messages
        "ai_summary": f"User needs help with: {topic}. Priority: {priority}.",
    }
    escalation_queue.append(esc)
    return esc

def get_escalation_by_session(session_id: str) -> Optional[dict]:
    for e in escalation_queue:
        if e["session_id"] == session_id and e["status"] in ("waiting", "active"):
            return e
    return None

def get_escalation_by_id(esc_id: str) -> Optional[dict]:
    for e in escalation_queue:
        if e["id"] == esc_id:
            return e
    return None

def get_analytics() -> dict:
    total = len(escalation_queue)
    resolved = sum(1 for e in escalation_queue if e["status"] == "resolved")
    waiting  = sum(1 for e in escalation_queue if e["status"] == "waiting")
    active   = sum(1 for e in escalation_queue if e["status"] == "active")
    rejected = sum(1 for e in escalation_queue if e["status"] == "rejected")
    return {
        "total_escalations": total,
        "resolved": resolved,
        "waiting": waiting,
        "active": active,
        "rejected": rejected,
        "agents_online": sum(1 for a in agents.values() if a["status"] == "online"),
        "agents_total": len(agents),
    }
