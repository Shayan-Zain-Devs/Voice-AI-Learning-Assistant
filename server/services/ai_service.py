import os
import json
import re
from openai import AsyncOpenAI
from dotenv import load_dotenv
# Import our secure tools from the MCP Server
from mcp_server import fetch_textbook_content, secure_log_quiz_score

load_dotenv()

# Initialize OpenAI Client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = "gpt-4o-mini" 

async def get_ai_response(system_prompt: str, user_prompt: str, json_mode: bool = False):
    """Core utility to talk to the LLM via OpenAI."""
    response_format = {"type": "json_object"} if json_mode else {"type": "text"}
    
    try:
        response = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format=response_format,
            timeout=60.0
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API Error: {e}")
        return None

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
        "generate exactly 5 unique, conversational questions that test conceptual understanding. "
        "The questions should follow a logical pedagogical progression (easier to harder). "
        "Return the response in JSON format."
    )
    user_prompt = (
        f"Topics to focus on: {topic_str}\n\n"
        f"Textbook Context: {context}\n\n"
        "Output Format: {\"questions\": [\"string1\", \"string2\", \"string3\", \"string4\", \"string5\"]}"
    )
    
    raw_response = await get_ai_response(system_prompt, user_prompt, json_mode=True)
    
    try:
        data = json.loads(raw_response)
        questions = data.get("questions", [])
        return questions[:5], context
    except Exception as e:
        print(f"Error parsing quiz questions: {e}")
        return ["Error generating questions via OpenAI."], ""


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
        "You are a professional academic examiner. Evaluate the student's transcript against the provided textbook context. "
        "Provide an overall score (0-100) based on accuracy and conceptual depth. "
        "Provide a concise, encouraging, yet critical feedback (max 3 sentences). "
        "List specific topics or concepts the student should review for improvement. "
        "Return the response in JSON format."
    )
    user_prompt = (
        f"CONTEXT:\n{context[:4000]}\n\n"
        f"TRANSCRIPT (Q&A Session):\n{transcript}\n\n"
        "Output Format: {\"score\": int, \"feedback\": \"string\", \"topics_to_review\": [\"string\"]}"
    )
    
    raw_response = await get_ai_response(system_prompt, user_prompt, json_mode=True)
    
    try:
        report = json.loads(raw_response)

        # 3. Securely Log via MCP Tool
        print(f"--- [MCP BRIDGE] Logging {topic}: {report.get('score', 0)}% ---")
        await secure_log_quiz_score(
            user_id=user_id,
            schedule_id=schedule_id,
            topic=topic,
            score=report.get('score', 0),
            feedback=report.get('feedback', "")
        )
        return report
    except Exception as e:
        print(f"MCP Session Evaluation Error: {e}")
        return {"score": 0, "feedback": "Evaluation/Logging failed via MCP.", "topics_to_review": []}