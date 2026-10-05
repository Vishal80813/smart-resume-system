# SmartResume AI — Full-Stack Resume Intelligence Platform

A polished AI SaaS-style portfolio project for resume parsing, semantic job matching, LLM-assisted rewriting, version storage and live PDF resume building.

## Stack

- Frontend: React + Vite + TypeScript + Framer Motion + Recharts + jsPDF
- Backend: FastAPI + Python
- Database: MongoDB Atlas via Motor
- AI: OpenAI chat + embeddings, with local Sentence Transformers fallback
- Document parsing: PyPDF + python-docx
- Auth: JWT + bcrypt

## Features

- Sharp responsive dashboard with dark/light mode
- Resume upload and document intelligence
- ATS/content/skills scoring
- Semantic job-description matching using embeddings + keyword evidence
- LLM resume bullet rewriting with truthfulness guardrails
- MongoDB authentication and resume version storage
- Live resume builder with templates, accent controls and client-side PDF export
- Skills intelligence dashboard
- Offline/demo fallback when external services are not configured

## Run

### Frontend

```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env  # Windows PowerShell: Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

Set `MONGODB_URI` and `OPENAI_API_KEY` in `.env` for persistent accounts, versions, real embeddings and LLM rewriting. Without them, the app still runs with deterministic/local demo behavior.

## Portfolio notes

The product is intentionally designed as a SaaS dashboard rather than a college CRUD UI: clear hierarchy, micro-interactions, data visualization, responsive states, live preview and recruiter-focused workflows.
