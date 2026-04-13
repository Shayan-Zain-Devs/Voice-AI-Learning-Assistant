import os
import asyncio
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import supabase_client
from services.pdf_processor import process_pdf
from services.embedder import embeddings
from services.ai_service import get_ai_response, generate_voice_quiz_mcp, evaluate_and_log_mcp
from pypdf import PdfReader
from datetime import datetime, timedelta
import json
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-textbook")
async def upload_textbook(
    file: UploadFile = File(...), 
    user_id: str = Form(...),
    title: str = Form(...),
    exam_date: str = Form(None)
):
    def get_time(): return datetime.now().strftime("%H:%M:%S")
    print(f"[{get_time()}] Phase 1: Starting upload for '{title}' (User: {user_id})")
    
    temp_file = f"temp_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    print(f"[{get_time()}] Phase 1: Temporary file '{temp_file}' created.")

    try:
        reader = PdfReader(temp_file)
        total_pages = len(reader.pages)
        print(f"[{get_time()}] Phase 2: PDF read successful. Total pages: {total_pages}")

        storage_path = f"{user_id}/{file.filename}"
        print(f"[{get_time()}] Phase 3: Uploading to Supabase Storage: {storage_path}")
        
        with open(temp_file, "rb") as f:
            supabase_client.storage.from_("textbooks").upload(
                path=storage_path,
                file=f,
                file_options={"content-type": "application/pdf", "upsert": "true"}
            )
        
        pdf_url = supabase_client.storage.from_("textbooks").get_public_url(storage_path)
        print(f"[{get_time()}] Phase 3: Storage upload complete. URL: {pdf_url}")

        textbook_res = supabase_client.table("textbooks").insert({
            "user_id": user_id,
            "title": title,
            "pdf_url": pdf_url,
            "total_pages": total_pages,
            "exam_date": exam_date
        }).execute()
        
        textbook_id = textbook_res.data[0]['id']
        print(f"[{get_time()}] Phase 4: Database record created. ID: {textbook_id}")

        print(f"[{get_time()}] Phase 5: Processing PDF text segments...")
        documents = process_pdf(temp_file)
        print(f"[{get_time()}] Phase 5: PDF processed into {len(documents)} segments.")
        
        chunks_to_insert = []
        texts = [doc.page_content.replace("\u0000", "") for doc in documents]
        
        print(f"[{get_time()}] Phase 6: Generating embeddings for {len(texts)} chunks...")
        vector_list = embeddings.embed_documents(texts)
        print(f"[{get_time()}] Phase 6: Embeddings generated.")

        for i, doc in enumerate(documents):
            chunks_to_insert.append({
                "textbook_id": textbook_id,
                "content": texts[i],
                "page_number": doc.metadata.get("page", 0) + 1,
                "embedding": vector_list[i],
                "metadata": doc.metadata
            })

        # Efficiency Fix: Insert in batches of 100 to avoid Supabase CPU spikes
        print(f"[{get_time()}] Phase 7: Inserting {len(chunks_to_insert)} chunks into 'textbook_segments'...")
        for i in range(0, len(chunks_to_insert), 100):
            batch_num = (i // 100) + 1
            print(f"          > Batch {batch_num} (Lines {i} to {min(i+100, len(chunks_to_insert))})")
            supabase_client.table("textbook_segments").insert(chunks_to_insert[i:i+100]).execute()

        print(f"[{get_time()}] Phase 8: Upload and processing complete!")
        return {"status": "success", "textbook_id": textbook_id, "chunks_processed": len(chunks_to_insert)}

    except Exception as e:
        print(f"[{get_time()}] ERROR during upload: {str(e)}")
        raise e

    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


@app.post("/generate-roadmap")
async def generate_roadmap(textbook_id: str = Form(...), user_id: str = Form(...)):
    try:
        book_res = supabase_client.table("textbooks").select("*").eq("id", textbook_id).single().execute()
        book = book_res.data
        total_pages = book['total_pages']
        exam_dt = datetime.strptime(book['exam_date'], '%Y-%m-%d').date()
        today = datetime.now().date()
        start_date = today
        days_available = (exam_dt - start_date).days + 1
        
        pages_per_day = max(1, total_pages // days_available)

        # 1. SAMPLING: Fetch context from 12 distinct spots
        sample_pages = list(range(5, total_pages, max(1, total_pages // 12)))
        segments_res = supabase_client.table("textbook_segments") \
            .select("content, page_number") \
            .eq("textbook_id", textbook_id) \
            .in_("page_number", sample_pages) \
            .execute()
        
        context_summary = "\n".join([f"P{s['page_number']}: {s['content'][:150]}" for s in segments_res.data])

        # 2. THE JSON PROMPT: Now using OpenAI with structured output
        system_prompt = (
            f"You are a professional study planner for the book '{book['title']}'. "
            "Your task is to create a structured list of study topics based on the book summary provided. "
            f"You must generate exactly {days_available} topics, one for each day. "
            "Each topic should be concise (2-4 words) and educational. "
            "Return the response in JSON format."
        )
        user_prompt = (
            f"Book Summary:\n{context_summary}\n\n"
            f"Required Days: {days_available}\n"
            "Output Format: {\"topics\": [\"Topic 1\", \"Topic 2\", ...]}"
        )
        
        ai_response = await get_ai_response(system_prompt, user_prompt, json_mode=True)
        
        # 3. STRUCTURED PARSING
        try:
            data = json.loads(ai_response)
            ai_topics = data.get("topics", [])
        except Exception as e:
            print(f"AI response parsing error: {e}")
            ai_topics = []

        # 4. BUILD THE SCHEDULE
        new_schedules = []
        current_page = 1
        for i in range(days_available):
            if current_page > total_pages: break
            day_start = current_page
            day_end = min(current_page + pages_per_day - 1, total_pages)
            if i == days_available - 1: day_end = total_pages 

            # Get topic from AI list, fallback to dynamic chapter label
            topic_label = ai_topics[i] if i < len(ai_topics) and len(ai_topics[i]) > 2 else f"Concept Focus P{day_start}"
            
            new_schedules.append({
                "user_id": user_id,
                "textbook_id": textbook_id,
                "scheduled_date": str(start_date + timedelta(days=i)),
                "page_range": f"{day_start}-{day_end}",
                "passing_criteria": [topic_label], # Must be a list
                "status": "pending"
            })
            current_page = day_end + 1

        # 5. BULK INSERT
        if new_schedules:
            supabase_client.table("daily_schedules").insert(new_schedules).execute()
            return {"status": "success", "days_generated": len(new_schedules)}
        
        return {"status": "error", "message": "No rows created."}

    except Exception as e:
        print(f"Critical Roadmap Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/voice/start-session")
async def start_voice_session(schedule_id: str = Form(...), textbook_id: str = Form(...)):
    # Get the basic task info
    sched = supabase_client.table("daily_schedules").select("*").eq("id", schedule_id).single().execute()
    
    # Hand off to MCP Agent
    questions, context = await generate_voice_quiz_mcp(
        textbook_id=textbook_id,
        page_range=sched.data['page_range'],
        topics=sched.data['passing_criteria']
    )
    return {"questions": questions, "context": context}

@app.post("/voice/complete-session")
async def complete_voice_session(
    user_id: str = Form(...),
    schedule_id: str = Form(...),
    textbook_id: str = Form(...),
    questions: str = Form(...), 
    answers: str = Form(...),   
    context: str = Form(...)
):
    q_list = json.loads(questions)
    a_list = json.loads(answers)

    
    sched = supabase_client.table("daily_schedules").select("*").eq("id", schedule_id).single().execute()
    topic_name = sched.data['passing_criteria'][0] if sched.data['passing_criteria'] else "General Study"

    report = await evaluate_and_log_mcp(
        user_id=user_id,
        schedule_id=schedule_id,
        textbook_id=textbook_id,
        questions=q_list,
        answers=a_list,
        context=context,
        topic=topic_name # Pass the real topic name
    )

    # Status Update Logic
    if report['score'] >= 60:
        supabase_client.table("daily_schedules").update({"status": "completed"}).eq("id", schedule_id).execute()
    
    return report  
