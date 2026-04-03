# 🎤 Voice-Based AI Learning Assistant  
### An Adaptive Intelligent Tutoring System  

**Developed by:**  
- Shayan Maqsood (CMS ID: 505768)  
- Zain Abid (CMS ID: 507257)  

---

## 🚀 Project Overview  

This project is a **Voice-First AI Tutor** designed to help students master textbooks through real-time oral assessment and adaptive scheduling.  

The system **injects knowledge from PDF textbooks into a vector database** and uses an AI "brain" to quiz students verbally.

---

## 🏗️ Tech Stack (Hybrid Architecture)  

- **Frontend:** React.js (Vite) + Tailwind CSS + Web Speech API  
- **Backend:** Python (FastAPI) + LangChain  
- **AI Models:** HuggingFace `multi-qa-distilbert-cos-v1` (768-dim embeddings)  
- **Database:** Supabase (PostgreSQL + pgvector)  
- **Automation Engine:** n8n (for adaptive scheduling)  

---

## 🧠 Advanced Database (ADBMS) Features  

### 🔹 Hybrid Vector Schema  
Combines:
- Relational Data → (Schedules, Profiles)  
- Vector Data → (Textbook Embeddings)  

All within a single ACID-compliant system.

---

### 🔹 Row-Level Security (RLS)  
- Implements a **Zero-Trust security model**  
- Uses JWT-based access control  
- Ensures complete data isolation between users  

---

### 🔹 Automated Triggers  
- **on_auth_user_created** → Syncs Auth with Profiles table  
- **update_mastery_score** → Calculates moving averages using atomic upserts  

---

### 🔹 Stored Procedures (RPC)  
- **match_textbook_chunks** → Vector similarity search using cosine distance  
- **adapt_schedule_on_failure** → Dynamically adjusts study roadmap  

---

### 🔹 Database Views  
- **student_analytics** → Precomputed analytics for O(1) dashboard performance  

---

## 🛠️ Installation & Setup  

### 1️⃣ Database Setup  
- Enable **pgvector extension** in Supabase  
- Run SQL migration scripts  
- Create storage bucket: `textbooks`  

---

### 2️⃣ Backend (FastAPI)  

```bash
cd server
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

Run the server:

uvicorn main:app --reload
3️⃣ Frontend (React)
cd client
npm install
npm run dev
🔑 Environment Variables

Create .env files in both client and server folders.

📁 Client .env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_public_key
📁 Server .env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_secret_master_key
🔄 The Interaction Loop
🟢 Onboarding
Student signs up
Trigger automatically creates profile
📚 Knowledge Injection
Upload PDF
Backend chunks text
Generates 768-dim embeddings
Stores in textbook_segments
🎤 Voice Quiz
AI retrieves context using vector search
Evaluates spoken answers
🔁 Adaptivity
If student fails:
Schedule is recalculated
Revision days are inserted
Future workload is adjusted
⚡ Key Highlight

This system combines:

AI (LLMs + embeddings)
Advanced Databases (pgvector, RLS, triggers, RPCs)
Real-time voice interaction

to create a fully adaptive, intelligent learning assistant.