from openai import AsyncOpenAI
import os
import json
import base64
import io
import PyPDF2
from dotenv import load_dotenv
from database import get_all_knowledge
import httpx
import re
import urllib.parse
from ddgs import DDGS
import asyncio

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(
    api_key=api_key,
    base_url="https://openrouter.ai/api/v1",
    max_retries=0,  # Never auto-retry — skip immediately on 429/402
)

# Verified available free models (fetched from OpenRouter API)
# Diverse providers: Google, NVIDIA, OpenAI OSS, Qwen, Venice
MODELS = [
    "openrouter/free",  # Auto-routes to the fastest available free model
]


async def search_web(query):
    """Perform DuckDuckGo search with 3s timeout."""
    try:
        def do_search():
            return list(DDGS().text(query, max_results=5))
        results = await asyncio.wait_for(asyncio.to_thread(do_search), timeout=3.0)
        return json.dumps(results)
    except Exception as e:
        print(f"Web search skipped/timeout: {e}")
        return ""


async def get_search_results_structured(query: str) -> list:
    """Return rich structured results for frontend search cards UI."""
    try:
        def do_search():
            return list(DDGS().text(query, max_results=6))
        raw = await asyncio.wait_for(asyncio.to_thread(do_search), timeout=4.0)
        results = []
        for r in raw:
            url = r.get("href", "")
            try:
                from urllib.parse import urlparse
                domain = urlparse(url).netloc
                favicon = f"https://www.google.com/s2/favicons?sz=32&domain={domain}"
            except Exception:
                favicon = ""
                domain = ""
            results.append({
                "title":   r.get("title", ""),
                "url":     url,
                "domain":  domain,
                "snippet": r.get("body", "")[:200],
                "favicon": favicon,
            })
        return results
    except Exception as e:
        print(f"Structured search failed: {e}")
        return []


async def fetch_weather_report(query: str) -> str:
    try:
        lower_q = query.lower()
        weather_keywords = ['weather', 'temperature', 'temp', 'abohawa', 'tapmatra', 'forecast', 'climate', 'celsius']
        if not any(k in lower_q for k in weather_keywords):
            return ""

        extract_msg = [{"role": "user", "content": f"Extract ONLY the city or location name from this query. If no specific location is mentioned, reply with NONE. Do not add any punctuation or extra words. Query: '{query}'"}]
        
        city = ""
        for model in MODELS:
            try:
                resp = await client.chat.completions.create(
                    model=model,
                    messages=extract_msg,
                    max_tokens=15,
                    temperature=0.1
                )
                city = resp.choices[0].message.content.strip()
                if city:
                    break
            except:
                continue
                
        if not city or city.upper() == "NONE" or len(city) > 30:
            return ""
            
        city = re.sub(r'[^\w\s-]', '', city).strip()
        if not city:
            return ""
            
        async with httpx.AsyncClient(timeout=4.0) as http_client:
            resp = await http_client.get(f"https://wttr.in/{urllib.parse.quote(city)}?format=j1")
            if resp.status_code == 200:
                data = resp.json()
                cc = data['current_condition'][0]
                area = data['nearest_area'][0]
                loc_name = area['areaName'][0]['value']
                country = area['country'][0]['value']
                
                weather_info = (
                    f"REAL-TIME WEATHER FOR {loc_name}, {country}:\n"
                    f"- Current Temperature: {cc['temp_C']}°C (Feels like {cc['FeelsLikeC']}°C)\n"
                    f"- Condition: {cc['weatherDesc'][0]['value']}\n"
                    f"- Humidity: {cc['humidity']}%\n"
                    f"- Wind Speed: {cc['windspeedKmph']} km/h\n"
                    f"- Cloud Cover: {cc['cloudcover']}%\n"
                    f"- Precipitation: {cc['precipMM']} mm\n"
                    f"- UV Index: {cc['uvIndex']}"
                )
                return weather_info
    except Exception as e:
        print(f"Weather fetch failed: {e}")
    return ""


async def build_messages(user_message: str, chat_history: list = None, attachments: list = None,
                         web_search: bool = True, prefetched_results: list = None):
    # Process PDF attachments
    pdf_text = ""
    if attachments:
        for att in attachments:
            if att.get("type", "") == "application/pdf":
                try:
                    pdf_bytes = base64.b64decode(att["base64"])
                    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
                    for page in reader.pages:
                        extracted = page.extract_text()
                        if extracted:
                            pdf_text += extracted + "\n"
                except Exception as e:
                    print(f"Error parsing PDF: {e}")

    if pdf_text:
        user_message += f"\n\n[EXTRACTED PDF DOCUMENT TEXT]:\n{pdf_text}\n(Please analyze the above document if the user asks about it.)"

    # Fetch knowledge base. Use prefetched results if available (avoids double search).
    weather_task = fetch_weather_report(user_message) if web_search else None
    kb_task = get_all_knowledge()
    
    if prefetched_results:
        kb_items = await kb_task
        web_results = json.dumps(prefetched_results)
        weather_data = await weather_task if weather_task else ""
    elif web_search:
        web_task = search_web(user_message)
        kb_items, web_results, weather_data = await asyncio.gather(kb_task, web_task, weather_task)
    else:
        kb_items = await kb_task
        web_results = ""
        weather_data = ""

    if weather_data:
        web_results = weather_data + "\n\n" + web_results

    kb_context = ""
    if kb_items:
        kb_context = "ADMIN KNOWLEDGE BASE (ABSOLUTE PRIORITY - YOU MUST USE THIS INFO IF RELEVANT):\n\n"
        for item in kb_items:
            kb_context += f"Q: {item['question']}\nA: {item['answer']}\n\n"

    web_context = ""
    if web_results:
        web_context = f"REAL-TIME WEB SEARCH RESULTS for '{user_message}':\n{web_results}\n\n"

    system_prompt = f"""You are ULMIND AI, an Ultra-Premium AI Assistant.

CRITICAL INSTRUCTIONS:
1. LANGUAGE DETECTION: You MUST respond in the EXACT SAME LANGUAGE the user used in their message.
   - If the user types in English, reply entirely in English.
   - If the user types in proper Bengali, reply in proper, formal Bengali.
   - If the user types in proper Hindi, reply in proper, formal Hindi.
   - Never output random characters or mix languages incorrectly.
2. ADMIN KNOWLEDGE BASE: ALWAYS prioritize the ADMIN KNOWLEDGE BASE first. If the user's question matches anything in it, base your answer heavily on that.
3. REAL-TIME DATA: If the user asks about current events, weather, business, finance, or real-time information, use the REAL-TIME WEB SEARCH RESULTS provided below to answer accurately.
4. Be direct, fast, and highly accurate.
5. Format your output in beautiful Markdown (bold, lists, code blocks with syntax highlighting).

{kb_context}
{web_context}
"""

    messages = [{"role": "system", "content": system_prompt}]

    if chat_history:
        for msg in chat_history[-6:]:
            content = msg["content"]
            if isinstance(content, list):
                content = next((item["text"] for item in content if item.get("type") == "text"), "")
            messages.append({"role": msg["role"], "content": content})

    has_images = any(att.get('type', '').startswith('image/') for att in (attachments or []))

    if has_images:
        content_array = [{"type": "text", "text": user_message}]
        for att in attachments:
            if att.get('type', '').startswith('image/'):
                content_array.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:{att['type']};base64,{att['base64']}"}
                })
        messages.append({"role": "user", "content": content_array})
    else:
        messages.append({"role": "user", "content": user_message})

    return messages


async def _try_models_stream(messages):
    """Try each model; skip immediately on 429/402. Return immediately on success."""
    for model in MODELS:
        try:
            print(f"[ULMIND AI Stream] Trying model: {model}")
            stream = await client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1500,
                temperature=0.3,
                stream=True,
            )
            full_response = ""
            async for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    full_response += delta
                    yield delta
            if full_response.strip():
                return  # ✅ Success
        except Exception as e:
            print(f"[ULMIND AI Stream] {model} → error: {e}")
            continue

    yield "⚠️ Free AI providers limit reached. Please wait or update API key."


async def get_ai_response_stream(user_message: str, chat_history: list = None, attachments: list = None,
                                  web_search: bool = True, prefetched_results: list = None):
    """Streaming version for real-time typewriter effect."""
    messages = await build_messages(user_message, chat_history, attachments, web_search, prefetched_results)
    async for chunk in _try_models_stream(messages):
        yield chunk


async def get_ai_response(user_message: str, chat_history: list = None, attachments: list = None,
                           web_search: bool = True, prefetched_results: list = None):
    """Non-streaming version."""
    messages = await build_messages(user_message, chat_history, attachments, web_search, prefetched_results)
    full = ""
    async for chunk in _try_models_stream(messages):
        full += chunk
    return full if full.strip() else "⚠️ All AI providers are temporarily busy. Please try again."
