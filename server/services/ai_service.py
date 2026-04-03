import os
import httpx
import json
import re
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
# You can change this to "openai/gpt-4o" later
MODEL_NAME = "nvidia/nemotron-3-super-120b-a12b:free" 

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
            timeout=60.0
        )
        
        if response.status_code != 200:
            print(f"AI Error: {response.text}")
            return None
            
        data = response.json()
        if 'choices' not in data:
            print(f"OpenRouter Error or Unexpected Response: {data}")
            return None
            
        return data['choices'][0]['message']['content']


async def generate_voice_quiz(context: str, topics: list):
    """
    Generates a list of 5 conceptual questions in one go.
    """
    topic_str = ", ".join(topics)
    system_prompt = (
        "You are an expert academic tutor. Based on the textbook context provided, "
        "generate EXACTLY 5 unique, short, conversational questions. "
        "Each question should test a different aspect of the topics provided. "
        "Return ONLY a JSON array of strings. Example: [\"Question 1\", \"Question 2\", ...]"
    )
    user_prompt = f"Topics: {topic_str}\n\nContext: {context}"
    
    raw_response = await get_ai_response(system_prompt, user_prompt)
    
    if not raw_response:
        return ["AI Service is currently busy or unavailable. Please try again in 1 minute."]
    
    try:
        clean_json = re.sub(r'```json|```', '', raw_response).strip()
        questions = json.loads(clean_json)
        # Ensure we always return exactly 5, even if AI failed
        return questions[:5] if isinstance(questions, list) else ["Could not generate questions."]
    except Exception as e:
        print(f"Quiz Generation Parse Error: {e}")
        return ["Error generating quiz. Please try again."]

async def evaluate_quiz_session(questions: list, answers: list, context: str):
    """
    Evaluates all 5 answers at once and returns a final report.
    """
    # Create a transcript for the AI to read
    transcript = ""
    for i in range(len(questions)):
        transcript += f"Q{i+1}: {questions[i]}\nStudent A{i+1}: {answers[i]}\n\n"

    system_prompt = (
        "You are an expert academic examiner. You will be provided with a transcript of a 5-question oral exam. "
        "Compare the student's answers against the provided textbook context. "
        "Calculate an overall score (0-100) based on accuracy and depth. "
        "Provide a summary feedback (max 2 sentences) and a list of 'Topics to Review' if they missed anything. "
        "Return ONLY a JSON object: {\"score\": int, \"feedback\": \"string\", \"topics_to_review\": [\"string\"]}"
    )
    
    user_prompt = f"TEXTBOOK CONTEXT:\n{context}\n\nEXAM TRANSCRIPT:\n{transcript}"
    
    raw_response = await get_ai_response(system_prompt, user_prompt)
    
    try:
        clean_json = re.sub(r'```json|```', '', raw_response).strip()
        return json.loads(clean_json)
    except Exception as e:
        print(f"Session Evaluation Error: {e}")
        return {"score": 0, "feedback": "Evaluation failed. Please try again.", "topics_to_review": []}
