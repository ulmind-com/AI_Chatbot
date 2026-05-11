import asyncio
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")

async def main():
    try:
        response = await client.chat.completions.create(
            model="meta-llama/llama-3.2-3b-instruct:free",
            messages=[{"role": "user", "content": "who is the pm of india?"}]
        )
        print("Success:", response.choices[0].message.content)
    except Exception as e:
        print("Error:", e)

asyncio.run(main())
