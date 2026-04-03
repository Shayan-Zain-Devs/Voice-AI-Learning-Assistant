import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
# You can change this to "openai/gpt-4o" later
MODEL_NAME = "stepfun/step-3.5-flash:free" 

async def get_ai_response(system_prompt: str, user_prompt: str):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json"
    }
    
    # Optional OpenRouter headers
    site_url = os.getenv("SITE_URL")
    site_name = os.getenv("SITE_NAME")
    if site_url:
        headers["HTTP-Referer"] = site_url
    if site_name:
        headers["X-Title"] = site_name

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30.0
        )
        
        if response.status_code != 200:
            print(f"AI Error: {response.text}")
            return None
            
        data = response.json()
        return data['choices'][0]['message']['content']