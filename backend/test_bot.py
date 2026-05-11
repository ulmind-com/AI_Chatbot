import asyncio
from openai_service import get_ai_response

async def main():
    print(await get_ai_response("who is the chief minister of west bengal?"))
    print(await get_ai_response("what is the company policy?")) # Let's assume there is KB for this.

asyncio.run(main())
