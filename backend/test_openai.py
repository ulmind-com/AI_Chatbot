import asyncio
from openai_service import get_ai_response, search_web

async def main():
    print("Testing DDGS...")
    web = await search_web("what is python")
    print("Web:", web)

    print("Testing OpenAI...")
    try:
        resp = await asyncio.wait_for(get_ai_response("what is python"), timeout=15)
        print("Resp:", resp)
    except Exception as e:
        print("Timeout or error:", e)

asyncio.run(main())
