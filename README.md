# 🎤 Voice-Based AI Learning Assistant  
### An Adaptive Intelligent Tutoring System  

**Developed by:**  
- Shayan Maqsood (CMS ID: 505768)  
- Zain Abid (CMS ID: 507257)  

---

## 🚀 Project Overview  

This project is a **Voice-First AI Tutor** designed to help students master textbooks through real-time oral assessment and adaptive scheduling.  

The system **injects knowledge from PDF textbooks into a vector database** and uses an AI "brain" powered by OpenAI and a specialized MCP (Model Context Protocol) Server to quiz students verbally, evaluate their responses, and adapt their study schedule dynamically.

---

## 🏗️ Tech Stack (Hybrid Architecture)  

- **Frontend:** React.js (Vite) + Tailwind CSS + Web Speech API for real-time voice interactions.
- **Backend:** Python (FastAPI) + LangChain + Model Context Protocol (MCP).
- **AI Models:** 
  - **OpenAI (`gpt-4o-mini`):** Powers the core conversational AI, evaluating transcripts and generating unique conceptual questions.
  - **HuggingFace (`multi-qa-distilbert-cos-v1`):** Generates 768-dimensional embeddings for textbook content chunking and semantic search.
- **Database:** Supabase (PostgreSQL + pgvector).
- **Automation Engine:** n8n (for adaptive scheduling workflows).

---

## 🔌 Model Context Protocol (MCP) Server Integration

This project leverages an **MCP Server** to safely provide the AI with specific tools, creating a seamless Agentic Flow:
- **Context Fetching (`fetch_textbook_content`):** The AI autonomously decides when it needs context and uses the MCP bridge to fetch highly relevant textbook data based on vector similarity.
- **Secure Logging (`secure_log_quiz_score`):** After evaluating a student's voice transcript, the AI securely logs the performance metrics (scores, feedback, topics to review) directly into the database through an authenticated MCP tool.

---

## 🧠 Advanced Database (ADBMS) Features  

### 🔹 Hybrid Vector Schema  
Combines:
- Relational Data → (Schedules, Profiles, Quiz Results)  
- Vector Data → (Textbook Embeddings)  

All within a single ACID-compliant system.

---

### 🔹 Row-Level Security (RLS)  
- Implements a **Zero-Trust security model**.
- Uses JWT-based access control.
- Ensures complete data isolation between users.

---

### 🔹 Automated Triggers  
- **on_auth_user_created** → Automatically syncs Supabase Auth with the custom Profiles table.
- **update_mastery_score** → Calculates moving averages using atomic upserts to keep track of a student's performance over time.

---

### 🔹 Stored Procedures (RPC)  
- **match_textbook_chunks** → Performs vector similarity search using cosine distance to retrieve context for the AI.
- **adapt_schedule_on_failure** → Dynamically adjusts the student's study roadmap when they fail a concept.

---

### 🔹 Database Views  
- **student_analytics** → Precomputed analytics for O(1) dashboard performance, enabling instant metric loading.

---

## 🔄 The Interaction Loop

1. **🟢 Onboarding**
   - Student signs up.
   - Database trigger automatically creates the student's profile.

2. **📚 Knowledge Injection**
   - Student or Admin uploads a PDF textbook.
   - The backend chunks the text and generates 768-dim embeddings using HuggingFace.
   - Embeddings are stored in the `textbook_segments` table using pgvector.

3. **🎤 Voice Quiz (Agentic Flow)**
   - The system initiates an oral quiz.
   - **OpenAI** identifies topics and uses the **MCP Server** to retrieve contextual data.
   - AI evaluates the student's spoken answers dynamically against the textbook context.
   - The AI securely logs the score and provides actionable feedback via MCP tools.

4. **🔁 Adaptivity**
   - If the student struggles or fails:
   - The schedule is recalculated automatically.
   - Revision days are inserted.
   - Future workload is adjusted dynamically to ensure mastery.

---

## 🛠️ Installation & Setup  

### 1️⃣ Database Setup  
- Create a Supabase project.
- Enable the **pgvector extension** in the database.
- Run the provided SQL migration scripts to set up the schema, RPCs, and triggers.
- Create a public storage bucket named: `textbooks` for PDF uploads.

### 2️⃣ Backend (FastAPI & MCP)  

```bash
cd server
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Run the server:
uvicorn main:app --reload
```

### 3️⃣ Frontend (React)

```bash
cd client
npm install
npm run dev
```

### 🔑 Environment Variables

Create `.env` files in both the `client` and `server` directories.

**📁 Client `.env`**
```ini
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

**📁 Server `.env`**
```ini
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_secret_master_key
```

---

## ⚡ Key Highlight

This system seamlessly combines:
- **State-of-the-art AI** (OpenAI GPT-4o-mini + HuggingFace Embeddings).
- **Agentic Capabilities** (Model Context Protocol for autonomous tool calling).
- **Advanced Databases** (Supabase pgvector, RLS, Triggers, RPCs).
- **Real-time voice interaction** (Web Speech API).

The result is a fully adaptive, intelligent, and autonomous learning assistant that closely mimics a human tutor.