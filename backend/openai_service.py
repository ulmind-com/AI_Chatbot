from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
from database import get_all_knowledge

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
base_url = "https://openrouter.ai/api/v1" if api_key and api_key.startswith("sk-or-") else None

client = AsyncOpenAI(api_key=api_key, base_url=base_url)

async def get_ai_response(user_message: str, chat_history: list = None):
    # Fetch custom knowledge base
    kb_items = await get_all_knowledge()
    kb_context = ""
    if kb_items:
        kb_context = "Here is the company knowledge base you must strictly follow:\n\n"
        for item in kb_items:
            kb_context += f"Q: {item['question']}\nA: {item['answer']}\n\n"

    system_prompt = f"""You are Nova AI, an Ultra-Premium AI Assistant.
INSTRUCTIONS:
1. Real-time Search: You have live internet access. Always use your search capabilities to provide up-to-date, real-time answers from Google/Web.
2. Knowledge Base: If the user asks about the company, strictly use the following knowledge base. Do not invent company policies.
3. Code & Analysis: Provide expert-level coding solutions and step-by-step analysis when asked.
4. Formatting: Format your answers beautifully using Markdown.

KNOWLEDGE BASE:
{kb_context}"""

    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    if chat_history:
        for msg in chat_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
    messages.append({"role": "user", "content": user_message})

    try:
        response = await client.chat.completions.create(
            model="perplexity/llama-3.1-sonar-large-128k-online", # Built-in real-time internet search
            messages=messages,
            max_tokens=2000, # Large output for code and analysis
            temperature=0.2, # Highly accurate
            top_p=0.9
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return "I'm sorry, I am currently unable to process your request. Please try again later."
