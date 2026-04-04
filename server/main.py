import os
import asyncio
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import supabase_client
from services.pdf_processor import process_pdf
from services.embedder import embeddings
from services.ai_service import get_ai_response, generate_voice_quiz, evaluate_quiz_session
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
    temp_file = f"temp_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        reader = PdfReader(temp_file)
        total_pages = len(reader.pages)
        storage_path = f"{user_id}/{file.filename}"
        
        with open(temp_file, "rb") as f:
            supabase_client.storage.from_("textbooks").upload(
                path=storage_path,
                file=f,
                file_options={"content-type": "application/pdf", "upsert": "true"}
            )
        
        pdf_url = supabase_client.storage.from_("textbooks").get_public_url(storage_path)

        textbook_res = supabase_client.table("textbooks").insert({
            "user_id": user_id,
            "title": title,
            "pdf_url": pdf_url,
            "total_pages": total_pages,
            "exam_date": exam_date
        }).execute()
        
        textbook_id = textbook_res.data[0]['id']
        documents = process_pdf(temp_file)
        
        chunks_to_insert = []
        texts = [doc.page_content.replace("\u0000", "") for doc in documents]
        vector_list = embeddings.embed_documents(texts)

        for i, doc in enumerate(documents):
            chunks_to_insert.append({
                "textbook_id": textbook_id,
                "content": texts[i],
                "page_number": doc.metadata.get("page", 0) + 1,
                "embedding": vector_list[i],
                "metadata": doc.metadata
            })

        # Efficiency Fix: Insert in batches of 100 to avoid Supabase CPU spikes
        for i in range(0, len(chunks_to_insert), 100):
            supabase_client.table("textbook_segments").insert(chunks_to_insert[i:i+100]).execute()

        return {"status": "success", "textbook_id": textbook_id, "chunks_processed": len(chunks_to_insert)}

    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


@app.post("/generate-roadmap")
async def generate_roadmap(textbook_id: str = Form(...), user_id: str = Form(...)):
    try:
        # 1. FETCH TEXTBOOK DETAILS
        book_res = supabase_client.table("textbooks").select("*").eq("id", textbook_id).single().execute()
        if not book_res.data:
            raise HTTPException(status_code=404, detail="Textbook not found")
            
        book = book_res.data
        total_pages = book['total_pages']
        exam_dt = datetime.strptime(book['exam_date'], '%Y-%m-%d').date()
        today = datetime.now().date()
        start_date = today + timedelta(days=1)
        days_available = (exam_dt - start_date).days + 1
        
        if days_available <= 0:
            raise HTTPException(status_code=400, detail="Exam date is too close!")

        pages_per_day = max(1, total_pages // days_available)
        print(f"Generating optimized roadmap for {days_available} days...")

        # 2. FETCH OVERVIEW CONTEXT (ONE QUERY)
        sample_pages = list(range(1, total_pages + 1, max(1, total_pages // 15)))
        segments_res = supabase_client.table("textbook_segments") \
            .select("content, page_number") \
            .eq("textbook_id", textbook_id) \
            .in_("page_number", sample_pages) \
            .execute()
        
        context_summary = "\n".join([f"Page {s['page_number']}: {s['content'][:200]}" for s in segments_res.data])

        # 3. UPDATED BATCH AI CALL (Requesting nested keywords)
        system_prompt = (
            f"You are an academic planner. I have a book with {total_pages} pages and {days_available} days to study. "
            f"Generate a nested JSON array where each sub-array contains 3-4 specific technical keywords for that study day. "
            f"Example for 2 days: [[\"Keyword A\", \"Keyword B\"], [\"Keyword C\", \"Keyword D\"]]. "
            f"Return EXACTLY {days_available} sub-arrays. Return ONLY the JSON."
        )
        user_prompt = f"Textbook Context Snippets:\n{context_summary}"
        
        ai_response = await get_ai_response(system_prompt, user_prompt)
        
        ai_days_keywords = []
        try:
            clean_json = re.sub(r'```json|```', '', ai_response).strip()
            ai_days_keywords = json.loads(clean_json)
        except:
            print("AI parsing failed, using fallback.")
            ai_days_keywords = [["Core Concepts", "Chapter Review"] for _ in range(days_available)]

        # 4. CONSTRUCT THE SCHEDULE
        new_schedules = []
        current_page = 1

        for i in range(days_available):
            if current_page > total_pages: break

            day_start = current_page
            day_end = min(current_page + pages_per_day - 1, total_pages)
            if i == days_available - 1: day_end = total_pages 

            # Match day to AI keyword sub-array
            day_keywords = ai_days_keywords[i] if i < len(ai_days_keywords) else ["General Study"]
            
            new_schedules.append({
                "user_id": user_id,
                "textbook_id": textbook_id,
                "scheduled_date": str(start_date + timedelta(days=i)),
                "page_range": f"{day_start}-{day_end}",
                "passing_criteria": day_keywords, 
                "status": "pending"
            })
            current_page = day_end + 1

        # 5. BULK INSERT
        if new_schedules:
            supabase_client.table("daily_schedules").insert(new_schedules).execute()
            return {"status": "success", "days_generated": len(new_schedules)}
        
        return {"status": "error", "message": "No rows created."}

    except Exception as e:
        print(f"Critical Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/voice/start-session")
async def start_voice_session(schedule_id: str = Form(...), textbook_id: str = Form(...)):
    sched = supabase_client.table("daily_schedules").select("*").eq("id", schedule_id).single().execute()
    page_range = sched.data['page_range']

    # CRASH-PROOF LOGIC
    if "-" in page_range:
        try:
            start_pg, end_pg = map(int, page_range.split('-'))
            segments = supabase_client.table("textbook_segments") \
                .select("content") \
                .eq("textbook_id", textbook_id) \
                .gte("page_number", start_pg) \
                .lte("page_number", end_pg) \
                .limit(8).execute()
        except:
            segments = supabase_client.table("textbook_segments").select("content").eq("textbook_id", textbook_id).limit(8).execute()
    else:
        # If it's REVISION or anything else, just grab 8 relevant segments from the book
        segments = supabase_client.table("textbook_segments").select("content").eq("textbook_id", textbook_id).limit(8).execute()

    context = " ".join([s['content'] for s in segments.data])
    questions = await generate_voice_quiz(context, sched.data['passing_criteria'])
    return {"questions": questions, "context": context}

@app.post("/voice/complete-session")
async def complete_voice_session(
    user_id: str = Form(...),
    schedule_id: str = Form(...),
    textbook_id: str = Form(...),
    questions: str = Form(...), # JSON string of list
    answers: str = Form(...),   # JSON string of list
    context: str = Form(...)
):
    q_list = json.loads(questions)
    a_list = json.loads(answers)

    # 1. Get the batch evaluation
    report = await evaluate_quiz_session(q_list, a_list, context)

    # 2. Log to Zain's study_logs (Triggers mastery update automatically)
    supabase_client.table("study_logs").insert({
        "user_id": user_id,
        "schedule_id": schedule_id,
        "topic": "Daily Voice Quiz",
        "score": report['score'],
        "ai_feedback": report['feedback']
    }).execute()

    # 3. If they failed (< 60%), trigger Zain's Adaptive Logic
    if report['score'] < 60 and report['topics_to_review']:
        supabase_client.rpc('adapt_schedule_on_failure', {
            'p_user_id': user_id,
            'p_textbook_id': textbook_id,
            'p_failed_topic': report['topics_to_review'][0]
        }).execute()

    return report        
