from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://sagnikmondal011_db_user:rTP2rp8F2RbCOots@cluster0.e6nbu3x.mongodb.net/?appName=Cluster0")
client = AsyncIOMotorClient(MONGODB_URI)
db = client.ai_chatbot_db
chat_collection = db.get_collection("chats")
kb_collection = db.get_collection("knowledge_base")

async def save_chat_message(session_id: str, role: str, content: str):
    message = {
        "session_id": session_id,
        "role": role,
        "content": content
    }
    await chat_collection.insert_one(message)

async def get_chat_history(session_id: str, limit: int = 20):
    cursor = chat_collection.find({"session_id": session_id}).sort("_id", -1).limit(limit)
    messages = await cursor.to_list(length=limit)
    return messages[::-1]  # Return in chronological order

async def get_all_knowledge():
    cursor = kb_collection.find()
    kb_items = await cursor.to_list(length=100)
    for item in kb_items:
        item["_id"] = str(item["_id"])
    return kb_items

async def add_knowledge(question: str, answer: str):
    result = await kb_collection.insert_one({"question": question, "answer": answer})
    return str(result.inserted_id)

async def delete_knowledge(kb_id: str):
    from bson.objectid import ObjectId
    result = await kb_collection.delete_one({"_id": ObjectId(kb_id)})
    return result.deleted_count > 0
