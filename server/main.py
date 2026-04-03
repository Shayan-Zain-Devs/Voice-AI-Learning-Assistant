import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from database import supabase_client
from services.pdf_processor import process_pdf
from services.embedder import embeddings
from pypdf import PdfReader

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
                file_options={"content-type": "application/pdf"}
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
        texts = [doc.page_content for doc in documents]
        
        # Generate all embeddings at once (efficient)
        vector_list = embeddings.embed_documents(texts)

        for i, doc in enumerate(documents):
            chunks_to_insert.append({
                "textbook_id": textbook_id,
                "content": doc.page_content,
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