# 🎙️ Voice-Based AI Learning Assistant
**Course:** CS 236: Advanced Database Management Systems (ADBMS)  
**Institution:** National University of Sciences & Technology (NUST)  
**Team Members:** Zain Abid (CMS: 507257), Shayan Maqsood (CMS: 505768)

## 📖 Project Overview
An intelligent, hands-free tutoring system that allows students to interact with textbooks via voice. The system leverages a **Hybrid Vector-Relational Database** to provide accurate context-aware responses and track student learning progress.

## 🛠️ Tech Stack
- **Frontend:** React.js (Vite + TypeScript)
- **Database:** PostgreSQL (via Supabase)
- **Extensions:** `pgvector` for high-dimensional vector search
- **Voice Engine:** Web Speech API (STT/TTS)
- **Security:** Row Level Security (RLS) Policies

## 📂 Database Architecture (ADBMS Focus)
This project implements several advanced database concepts required for the CS 236 course:
1. **Schema Design:** Normalized 3NF relational tables for profiles and logs.
2. **Hybrid Storage:** Integrated storage of unstructured textbook data (Vectors) and structured performance data (SQL).
3. **Data Optimization:** Implementation of **HNSW Indexing** for ultra-fast AI context retrieval.
4. **Security & Integrity:** Advanced **RLS (Row Level Security)** to ensure data privacy and cross-user isolation.
5. **Data Processing:** Complex SQL `ILIKE` pattern matching and keyword extraction logic.

## 🚀 Current Project State
- [x] Cloud Database Infrastructure (Supabase) Setup.
- [x] Relational Schema & RLS Security Policies implemented.
- [x] Frontend-to-Database connectivity established.
- [x] Voice-to-SQL keyword search engine functional.
- [x] Text-to-Speech (AI Response) integrated.

## ⚙️ Setup Instructions
1. **Clone the repo:** `git clone <repo-url>`
2. **Setup Client:**
   - `cd client`
   - `npm install`
   - Create `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - `npm run dev`
3. **Setup Database:**
   - Use the SQL scripts provided in `/database` (or the SQL Editor) to initialize tables and extensions.