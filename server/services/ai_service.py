import os
import httpx
import json
import re
from dotenv import load_dotenv
# Import our secure tools from the MCP Server
from mcp_server import fetch_textbook_content, secure_log_quiz_score

load_dotenv()

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_NAME = "nvidia/nemotron-3-super-120b-a12b:free" 

async def get_ai_response(system_prompt: str, user_prompt: str):
    """Core utility to talk to the LLM via OpenRouter."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json"
    }
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
            headers=headers, json=payload, timeout=60.0
        )
        if response.status_code != 200: return None
        data = response.json()
        return data['choices'][0]['message']['content']

# --- PRIMARY MCP AGENTIC FUNCTIONS ---

async def generate_voice_quiz_mcp(textbook_id: str, page_range: str, topics: list):
    """
    AGENTIC FLOW: 
    1. AI decides it needs context.
    2. Uses MCP Bridge to fetch textbook data.
    3. Generates 5 unique conceptual questions.
    """
    print(f"--- [MCP BRIDGE] Fetching context for {page_range} ---")
    
    # 1. Fetch context via MCP Tool
    context = await fetch_textbook_content(textbook_id, page_range)

    # 2. Generate Questions
    topic_str = ", ".join(topics)
    system_prompt = (
        "You are an expert academic tutor. Based on the textbook context provided, "
        "generate EXACTLY 5 unique, short, conversational questions. "
        "Return ONLY a JSON array of strings. Example: [\"Q1\", \"Q2\", ...]"
    )
    user_prompt = f"Topics: {topic_str}\n\nContext from MCP: {context}"
    
    raw_response = await get_ai_response(system_prompt, user_prompt)
    
    try:
        clean_json = re.sub(r'```json|```', '', raw_response).strip()
        questions = json.loads(clean_json)
        return questions[:5], context
    except:
        return ["Error generating questions via MCP bridge."], ""


async def evaluate_and_log_mcp(user_id, schedule_id, textbook_id, questions, answers, context, topic):
    """
    AGENTIC FLOW:
    1. AI evaluates the voice transcript against context.
    2. AI uses MCP Tool to SECURELY log the result with dynamic topic name.
    """
    # 1. Build Transcript
    transcript = ""
    for i in range(len(questions)):
        transcript += f"Q{i+1}: {questions[i]}\nStudent A{i+1}: {answers[i]}\n\n"

    # 2. Evaluate
    system_prompt = (
        "You are an academic examiner. Evaluate the transcript against the context. "
        "Calculate an overall score (0-100). Provide feedback (max 2 sentences). "
        "Return ONLY a JSON object: {\"score\": int, \"feedback\": \"string\", \"topics_to_review\": [\"string\"]}"
    )
    user_prompt = f"CONTEXT:\n{context[:3000]}\n\nTRANSCRIPT:\n{transcript}"
    
    raw_response = await get_ai_response(system_prompt, user_prompt)
    
    try:
        # Extract JSON even if AI adds conversational filler
        match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        report = json.loads(match.group(0))

        # 3. Securely Log via MCP Tool
        print(f"--- [MCP BRIDGE] Logging {topic}: {report['score']}% ---")
        await secure_log_quiz_score(
            user_id=user_id,
            schedule_id=schedule_id,
            topic=topic,
            score=report['score'],
            feedback=report['feedback']
        )
        return report
    except Exception as e:
        print(f"MCP Session Evaluation Error: {e}")
        return {"score": 0, "feedback": "Evaluation/Logging failed via MCP.", "topics_to_review": []}