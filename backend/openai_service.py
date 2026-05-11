from openai import AsyncOpenAI
import os
import json
import base64
import io
import PyPDF2
from dotenv import load_dotenv
from database import get_all_knowledge
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
    "google/gemma-4-26b-a4b-it:free",              # Google — latest Gemma 4
    "nvidia/nemotron-nano-9b-v2:free",              # NVIDIA — fast small model
    "openai/gpt-oss-20b:free",                      # OpenAI OSS — reliable
    "nvidia/nemotron-3-super-120b-a12b:free",       # NVIDIA — large/smart
    "meta-llama/llama-3.3-70b-instruct:free",       # Venice — high quality
    "meta-llama/llama-3.2-3b-instruct:free",        # Venice — fast fallback
    "nousresearch/hermes-3-llama-3.1-405b:free",    # Venice — large fallback
    "qwen/qwen3-coder:free",                        # Venice — coding
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
    kb_task = get_all_knowledge()
    if prefetched_results:
        kb_items = await kb_task
        web_results = json.dumps(prefetched_results)
    elif web_search:
        web_task = search_web(user_message)
        kb_items, web_results = await asyncio.gather(kb_task, web_task)
    else:
        kb_items = await kb_task
        web_results = ""

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
    """Try each model; skip immediately on 429/402. Smart retry once if ALL providers fail."""
    RETRY_WAIT = 16  # seconds — matches Venice rate limit window

    for attempt in range(2):
        all_rate_limited = True
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
                all_rate_limited = False
            except Exception as e:
                err_str = str(e)
                is_rate = '429' in err_str or '402' in err_str
                if is_rate:
                    print(f"[ULMIND AI Stream] {model} → rate limited, skipping...")
                    continue
                all_rate_limited = False
                print(f"[ULMIND AI Stream] {model} → error: {e}")
                continue

        if all_rate_limited and attempt == 0:
            print(f"[ULMIND AI Stream] All providers rate-limited. Waiting {RETRY_WAIT}s...")
            yield f"\n\n⏳ *AI providers are briefly busy — retrying in {RETRY_WAIT}s...*\n\n"
            await asyncio.sleep(RETRY_WAIT)
        else:
            break

    yield "⚠️ All AI providers are temporarily busy. Please send your message again in a moment."


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
