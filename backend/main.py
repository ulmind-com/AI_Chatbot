from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pydantic import BaseModel
from dotenv import load_dotenv
from database import save_chat_message, get_chat_history, get_all_knowledge, add_knowledge, delete_knowledge
from openai_service import get_ai_response, get_ai_response_stream, get_search_results_structured
from agent_router import agent_router

load_dotenv()

app = FastAPI(title="AI Chatbot Platform API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev. In prod, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global exception: {exc}")
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Headers"] = "*"
        headers["Access-Control-Allow-Methods"] = "*"
    return JSONResponse(
        status_code=500,
        content={"detail": "Database Connection Timeout", "error": str(exc)},
        headers=headers
    )

class KnowledgeItem(BaseModel):
    question: str
    answer: str

class LoginRequest(BaseModel):
    email: str
    password: str

# Simple token dependency
async def verify_token(authorization: str = Header(None)):
    if authorization != "Bearer secret-admin-token":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

@app.get("/")
async def root():
    return {"message": "Welcome to the AI Chatbot Platform API"}

@app.post("/api/login")
async def login(req: LoginRequest):
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    if req.email == admin_email and req.password == admin_password:
        return {"token": "secret-admin-token"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/knowledge")
async def get_knowledge():
    return await get_all_knowledge()

@app.post("/api/knowledge")
async def create_knowledge(item: KnowledgeItem, authorized: bool = Depends(verify_token)):
    kb_id = await add_knowledge(item.question, item.answer)
    return {"id": kb_id, "message": "Knowledge added successfully"}

@app.delete("/api/knowledge/{kb_id}")
async def remove_knowledge(kb_id: str, authorized: bool = Depends(verify_token)):
    success = await delete_knowledge(kb_id)
    if not success:
        raise HTTPException(status_code=404, detail="Knowledge not found")
    return {"message": "Knowledge deleted successfully"}

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid.uuid4())
    try:
        while True:
            data = await websocket.receive_text()
            try:
                import json
                try:
                    payload = json.loads(data)
                    user_text  = payload.get("text", "")
                    attachments = payload.get("attachments", [])
                    web_search  = payload.get("webSearch", True)  # default ON
                except json.JSONDecodeError:
                    user_text  = data
                    attachments = []
                    web_search  = True

                # Save user message
                await save_chat_message(session_id, "user", user_text)

                # Get chat history for context
                history = await get_chat_history(session_id, limit=6)

                # ── If web search enabled: fetch structured results first ──
                search_results = []
                if web_search and user_text.strip():
                    search_results = await get_search_results_structured(user_text)
                    if search_results:
                        await websocket.send_text(f"SEARCH_RESULTS:{json.dumps(search_results)}")

                # ── STREAMING AI response (pass prefetched results to avoid double search) ──
                full_response = ""
                async for chunk in get_ai_response_stream(
                    user_text, history, attachments,
                    web_search=web_search,
                    prefetched_results=search_results if search_results else None
                ):
                    full_response += chunk
                    await websocket.send_text(f"CHUNK:{chunk}")

                await websocket.send_text("DONE")

                if full_response.strip():
                    await save_chat_message(session_id, "assistant", full_response)

            except Exception as e:
                print(f"Error handling message: {e}")
                await websocket.send_text("CHUNK:⚠️ Something went wrong. Please try again.")
                await websocket.send_text("DONE")

    except WebSocketDisconnect:
        print(f"Client disconnected: {session_id}")

