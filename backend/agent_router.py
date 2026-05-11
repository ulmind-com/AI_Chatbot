"""
Live Agent WebSocket + REST routes for the handover system.
Mount this router in main.py with: app.include_router(agent_router)
"""
import json
import asyncio
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from agent_service import (
    agents, escalation_queue, active_sessions,
    agent_connections, user_connections,
    create_escalation, get_escalation_by_session,
    get_escalation_by_id, get_available_agent, get_analytics
)

agent_router = APIRouter(prefix="/api/agent", tags=["agent"])

# ── Pydantic models ───────────────────────────────────────────────
class EscalateRequest(BaseModel):
    session_id: str
    user_name: str
    chat_history: List[dict] = []
    topic: str = "General Support"
    priority: str = "normal"
    reason: str = ""

class AgentMessageRequest(BaseModel):
    escalation_id: str
    agent_id: str
    text: str

class UserMessageRequest(BaseModel):
    escalation_id: str
    session_id: str
    text: str

class ResolveRequest(BaseModel):
    escalation_id: str
    agent_id: str

class AgentStatusRequest(BaseModel):
    agent_id: str
    status: str  # online | away | offline

# ── Broadcast helpers ─────────────────────────────────────────────
async def notify_user(session_id: str, payload: dict):
    ws = user_connections.get(session_id)
    if ws:
        try:
            await ws.send_text(json.dumps(payload))
        except Exception:
            pass

async def notify_agent(agent_id: str, payload: dict):
    ws = agent_connections.get(agent_id)
    if ws:
        try:
            await ws.send_text(json.dumps(payload))
        except Exception:
            pass

async def broadcast_agents(payload: dict):
    for aid in list(agent_connections.keys()):
        await notify_agent(aid, payload)

# ── REST endpoints ────────────────────────────────────────────────
@agent_router.get("/agents")
async def list_agents():
    return list(agents.values())

@agent_router.get("/analytics")
async def get_agent_analytics():
    return get_analytics()

@agent_router.get("/queue")
async def get_queue():
    return [e for e in escalation_queue if e["status"] == "waiting"]

@agent_router.get("/active")
async def get_active_chats():
    return [e for e in escalation_queue if e["status"] == "active"]

@agent_router.get("/all")
async def get_all_escalations():
    return escalation_queue

@agent_router.post("/escalate")
async def escalate_to_agent(req: EscalateRequest):
    # Check if already escalated
    existing = get_escalation_by_session(req.session_id)
    if existing:
        return {"escalation": existing, "message": "Already in queue"}

    esc = create_escalation(
        session_id=req.session_id,
        user_name=req.user_name,
        chat_history=req.chat_history,
        topic=req.topic,
        priority=req.priority,
        reason=req.reason,
    )

    # Try auto-assign
    agent_id = get_available_agent()
    if agent_id:
        esc["agent_id"] = agent_id
        esc["status"] = "active"
        esc["accepted_at"] = datetime.utcnow().isoformat()
        agents[agent_id]["active_chats"] += 1
        agent_name = agents[agent_id]["name"]
        await notify_user(req.session_id, {
            "type": "agent_joined",
            "agent_name": agent_name,
            "agent_id": agent_id,
            "escalation_id": esc["id"],
            "message": f"Hi! I'm {agent_name}, I'll be helping you today. 😊"
        })
        await notify_agent(agent_id, {
            "type": "new_chat_assigned",
            "escalation": esc
        })
    else:
        # No agent — broadcast to all agents
        await broadcast_agents({
            "type": "new_escalation",
            "escalation": esc
        })

    return {"escalation": esc, "auto_assigned": agent_id is not None}

@agent_router.post("/accept")
async def accept_chat(data: dict):
    esc_id = data.get("escalation_id")
    agent_id = data.get("agent_id")
    esc = get_escalation_by_id(esc_id)
    if not esc:
        raise HTTPException(404, "Escalation not found")
    if esc["status"] != "waiting":
        raise HTTPException(400, "Chat already assigned or resolved")

    esc["agent_id"] = agent_id
    esc["status"] = "active"
    esc["accepted_at"] = datetime.utcnow().isoformat()
    agents[agent_id]["active_chats"] = agents[agent_id].get("active_chats", 0) + 1

    agent_name = agents[agent_id]["name"]
    await notify_user(esc["session_id"], {
        "type": "agent_joined",
        "agent_name": agent_name,
        "agent_id": agent_id,
        "escalation_id": esc_id,
        "message": f"Hi! I'm {agent_name}, I'll be helping you today. 😊"
    })
    await broadcast_agents({"type": "queue_update", "escalation": esc})
    return esc

@agent_router.post("/reject")
async def reject_chat(data: dict):
    esc_id = data.get("escalation_id")
    esc = get_escalation_by_id(esc_id)
    if not esc:
        raise HTTPException(404, "Escalation not found")
    esc["status"] = "rejected"
    await notify_user(esc["session_id"], {
        "type": "escalation_rejected",
        "message": "All agents are currently busy. Please try again later or leave a message."
    })
    return {"message": "Rejected"}

@agent_router.post("/message/agent")
async def agent_send_message(req: AgentMessageRequest):
    esc = get_escalation_by_id(req.escalation_id)
    if not esc:
        raise HTTPException(404, "Escalation not found")
    msg = {
        "id": f"msg-{len(esc['messages'])+1}",
        "from": "agent",
        "agent_id": req.agent_id,
        "agent_name": agents.get(req.agent_id, {}).get("name", "Agent"),
        "text": req.text,
        "timestamp": datetime.utcnow().isoformat()
    }
    esc["messages"].append(msg)
    await notify_user(esc["session_id"], {"type": "agent_message", "message": msg})
    return msg

@agent_router.post("/message/user")
async def user_send_message(req: UserMessageRequest):
    esc = get_escalation_by_id(req.escalation_id)
    if not esc:
        raise HTTPException(404, "Escalation not found")
    msg = {
        "id": f"msg-{len(esc['messages'])+1}",
        "from": "user",
        "session_id": req.session_id,
        "text": req.text,
        "timestamp": datetime.utcnow().isoformat()
    }
    esc["messages"].append(msg)
    if esc.get("agent_id"):
        await notify_agent(esc["agent_id"], {"type": "user_message", "message": msg, "escalation_id": req.escalation_id})
    return msg

@agent_router.post("/resolve")
async def resolve_chat(req: ResolveRequest):
    esc = get_escalation_by_id(req.escalation_id)
    if not esc:
        raise HTTPException(404, "Escalation not found")
    esc["status"] = "resolved"
    esc["resolved_at"] = datetime.utcnow().isoformat()
    if req.agent_id in agents:
        agents[req.agent_id]["active_chats"] = max(0, agents[req.agent_id]["active_chats"] - 1)
        agents[req.agent_id]["resolved_today"] = agents[req.agent_id].get("resolved_today", 0) + 1
    await notify_user(esc["session_id"], {
        "type": "chat_resolved",
        "message": "Your issue has been marked as resolved. Thank you! 🎉"
    })
    await broadcast_agents({"type": "queue_update", "escalation": esc})
    return {"message": "Resolved", "escalation": esc}

@agent_router.post("/status")
async def update_agent_status(req: AgentStatusRequest):
    if req.agent_id not in agents:
        raise HTTPException(404, "Agent not found")
    agents[req.agent_id]["status"] = req.status
    await broadcast_agents({"type": "agent_status_update", "agent_id": req.agent_id, "status": req.status})
    return agents[req.agent_id]

# ── WebSocket: User side ──────────────────────────────────────────
@agent_router.websocket("/ws/user/{session_id}")
async def user_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    user_connections[session_id] = websocket
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            if payload.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        user_connections.pop(session_id, None)

# ── WebSocket: Agent side ─────────────────────────────────────────
@agent_router.websocket("/ws/agent/{agent_id}")
async def agent_ws(websocket: WebSocket, agent_id: str):
    await websocket.accept()
    agent_connections[agent_id] = websocket
    if agent_id in agents:
        agents[agent_id]["status"] = "online"
        await broadcast_agents({"type": "agent_status_update", "agent_id": agent_id, "status": "online"})
    # Send current queue on connect
    queue = [e for e in escalation_queue if e["status"] == "waiting"]
    await websocket.send_text(json.dumps({"type": "init_queue", "queue": queue, "agents": list(agents.values())}))
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            if payload.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        agent_connections.pop(agent_id, None)
        if agent_id in agents:
            agents[agent_id]["status"] = "offline"
            await broadcast_agents({"type": "agent_status_update", "agent_id": agent_id, "status": "offline"})
