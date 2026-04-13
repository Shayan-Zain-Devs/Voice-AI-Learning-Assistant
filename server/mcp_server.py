# mcp_server.py
import os
from fastmcp import FastMCP
from database import supabase_client
from dotenv import load_dotenv

load_dotenv()

# Initialize FastMCP Server
mcp = FastMCP("VoiceAI-Learning-Assistant")

@mcp.tool()
async def fetch_textbook_content(textbook_id: str, page_range: str):
    """
    MCP TOOL: Fetches textbook segments based on a page range or 'REVISION' status.
    This ensures the AI only sees the data it is authorized to read.
    """
    if "-" in page_range:
        try:
            start_pg, end_pg = map(int, page_range.split('-'))
            res = supabase_client.table("textbook_segments") \
                .select("content") \
                .eq("textbook_id", textbook_id) \
                .gte("page_number", start_pg) \
                .lte("page_number", end_pg) \
                .limit(8).execute()
        except:
            res = supabase_client.table("textbook_segments").select("content").eq("textbook_id", textbook_id).limit(8).execute()
    else:
        # Handling REVISION days
        res = supabase_client.table("textbook_segments").select("content").eq("textbook_id", textbook_id).limit(8).execute()

    return " ".join([s['content'] for s in res.data])

@mcp.tool()
async def secure_log_quiz_score(user_id: str, schedule_id: str, topic: str, score: int, feedback: str):
    """
    MCP TOOL: Securely logs a student's score with a specific topic name.
    """
    res = supabase_client.table("study_logs").insert({
        "user_id": user_id,
        "schedule_id": schedule_id,
        "topic": topic, # Use the dynamic topic name here!
        "score": score,
        "ai_feedback": feedback
    }).execute()
    return res.data