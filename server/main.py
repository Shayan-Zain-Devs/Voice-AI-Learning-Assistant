import os
import asyncio
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import supabase_client
from services.pdf_processor import process_pdf
from services.embedder import embeddings
from services.ai_service import get_ai_response
from pypdf import PdfReader
from datetime import datetime, timedelta

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Your Vite dev server
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
        # 1. Get Total Pages
        reader = PdfReader(temp_file)
        total_pages = len(reader.pages)

        # 2. Upload to Storage (Matches your RLS Policy)
        # Your RLS requires the path to be: 'user_id/filename'
        storage_path = f"{user_id}/{file.filename}"
        
        with open(temp_file, "rb") as f:
            supabase_client.storage.from_("textbooks").upload(
                path=storage_path,
                file=f,
                file_options={
                    "content-type": "application/pdf",
                    "upsert": "true"
                }
            )
        
        pdf_url = supabase_client.storage.from_("textbooks").get_public_url(storage_path)

        # 3. Create Parent Textbook Record
        textbook_res = supabase_client.table("textbooks").insert({
            "user_id": user_id,
            "title": title,
            "pdf_url": pdf_url,
            "total_pages": total_pages,
            "exam_date": exam_date
        }).execute()
        
        textbook_id = textbook_res.data[0]['id']

        # 4. Process and Chunk PDF using LangChain
        documents = process_pdf(temp_file)
        
        # 5. Manual Vectorization & Insertion
        # We do this manually instead of using LangChain's VectorStore 
        # so we can fill your EXACT columns: textbook_id and page_number.
        
        chunks_to_insert = []
        # Sanitize content for PostgreSQL (remove null characters)
        texts = [doc.page_content.replace("\u0000", "") for doc in documents]
        
        # Generate all embeddings at once (efficient)
        vector_list = embeddings.embed_documents(texts)

        for i, doc in enumerate(documents):
            chunks_to_insert.append({
                "textbook_id": textbook_id,
                "content": texts[i], # Use the sanitized text
                "page_number": doc.metadata.get("page", 0) + 1,
                "embedding": vector_list[i],
                "metadata": doc.metadata # keep the rest in the jsonb column
            })

        # Bulk insert into textbook_segments
        supabase_client.table("textbook_segments").insert(chunks_to_insert).execute()

        return {
            "status": "success", 
            "textbook_id": textbook_id, 
            "chunks_processed": len(chunks_to_insert)
        }

    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

@app.post("/generate-roadmap")
async def generate_roadmap(textbook_id: str = Form(...), user_id: str = Form(...)):
    try:
        # 1. FETCH TEXTBOOK DETAILS
        # We need the total pages and exam date to do the math
        book_res = supabase_client.table("textbooks").select("*").eq("id", textbook_id).single().execute()
        
        if not book_res.data:
            raise HTTPException(status_code=404, detail="Textbook not found")
            
        book = book_res.data
        total_pages = book['total_pages']
        
        # Parse exam date (Format: YYYY-MM-DD)
        exam_dt = datetime.strptime(book['exam_date'], '%Y-%m-%d').date()
        today = datetime.now().date()
        
        # 2. CALCULATE DURATION
        # We start the schedule from tomorrow
        start_date = today + timedelta(days=1)
        days_available = (exam_dt - start_date).days + 1
        
        if days_available <= 0:
            raise HTTPException(status_code=400, detail="Exam date is too close or in the past!")

        # 3. CALCULATE PAGES PER DAY
        pages_per_day = max(1, total_pages // days_available)
        
        new_schedules = []
        current_page = 1

        print(f"Generating {days_available} days of study for {total_pages} pages...")

        # 4. LOOP THROUGH EACH DAY
        for i in range(days_available):
            if current_page > total_pages:
                break

            day_start_page = current_page
            day_end_page = min(current_page + pages_per_day - 1, total_pages)
            # Ensure the last day finishes the book
            if i == days_available - 1:
                day_end_page = total_pages
                
            scheduled_date = start_date + timedelta(days=i)

            # 5. FETCH AI CONTEXT
            # We fetch a few chunks from these pages so the AI knows what's in them
            segments = supabase_client.table("textbook_segments") \
                .select("content") \
                .eq("textbook_id", textbook_id) \
                .gte("page_number", day_start_page) \
                .lte("page_number", day_end_page) \
                .limit(3).execute()
            
            context_text = " ".join([s['content'][:300] for s in segments.data])

            # 6. CALL OPENROUTER (QWEN) FOR KEYWORDS
            # This fills Zain's 'passing_criteria' array
            system_prompt = "You are an expert academic tutor. Extract 3-4 specific technical keywords or topics from the provided text. Return ONLY the keywords separated by commas."
            user_prompt = f"Text Context: {context_text}"
            
            # Add a small delay to avoid rate limiting on free tier models
            await asyncio.sleep(2)
            
            ai_keywords = await get_ai_response(system_prompt, user_prompt)
            
            # Clean AI response into a list of strings
            if ai_keywords:
                # Remove quotes, periods, and split by comma
                clean_list = [k.strip().replace('"', '').replace('.', '') for k in ai_keywords.split(",")]
                # Limit to 4 keywords to keep the UI clean
                passing_criteria = clean_list[:4]
            else:
                passing_criteria = ["General Reading", "Core Concepts"]

            # 7. PREPARE DB ROW (Matching Zain's Schema)
            new_schedules.append({
                "user_id": user_id,
                "textbook_id": textbook_id,
                "scheduled_date": str(scheduled_date),
                "page_range": f"{day_start_page}-{day_end_page}",
                "passing_criteria": passing_criteria, # Postgres TEXT[] array
                "status": "pending"
            })
            
            current_page = day_end_page + 1

        # 8. BULK INSERT INTO DAILY_SCHEDULES
        if new_schedules:
            insert_res = supabase_client.table("daily_schedules").insert(new_schedules).execute()
            return {
                "status": "success", 
                "days_generated": len(new_schedules),
                "start_date": str(start_date),
                "end_date": str(exam_dt)
            }
        
        return {"status": "error", "message": "No schedule rows were created."}

    except Exception as e:
        print(f"Error generating roadmap: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))            