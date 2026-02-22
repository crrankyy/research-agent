# AI Research Agent

An autonomous, multi-agent research assistant that takes a user's question, searches the web and academic databases, and synthesizes a structured, citation-backed report — all through a premium dark-mode interface.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)               │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Sidebar  │  │ Main Content │  │  Action Log      │   │
│  │ (history)│  │ (views)      │  │  (observability) │   │
│  └──────────┘  └──────┬───────┘  └──────────────────┘   │
│                       │ JWT Bearer tokens                │
├───────────────────────┼─────────────────────────────────┤
│              REST API │ (Flask, port 5001)               │
│  ┌────────────────────┼──────────────────────────────┐   │
│  │  Auth Layer   │  Research Endpoints  │  Chat API  │   │
│  │  (JWT)        │  (async workers)     │ (follow-up)│   │
│  └───────┬───────┴──────────┬───────────┴────┬───────┘   │
│          │                  │                │           │
│  ┌───────┴──────┐  ┌───────┴──────┐  ┌──────┴───────┐   │
│  │  SQLite DB   │  │ ResearchAgent│  │FollowUpAgent │   │
│  │  (SQLAlchemy)│  │ (planning +  │  │ (isolated    │   │
│  │              │  │  synthesis)  │  │  Q&A agent)  │   │
│  └──────────────┘  └──────┬───────┘  └──────┬───────┘   │
│                           │                 │           │
│                    ┌──────┴─────────────────┴──────┐    │
│                    │      OpenRouter API            │    │
│                    │  (LLM gateway → free models)  │    │
│                    └──────┬──────────────┬─────────┘    │
│                           │              │              │
│                    ┌──────┴──────┐ ┌─────┴──────┐      │
│                    │ DuckDuckGo  │ │   arXiv    │      │
│                    │ Web Search  │ │  Academic  │      │
│                    └─────────────┘ └────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## Key Technical Decisions

### 1. Two-Agent Architecture (Strict Isolation)

The system uses **two completely separate LLM agents** with no shared state:

| Agent | File | Purpose | Context |
|-------|------|---------|---------|
| **ResearchAgent** | `backend/agent.py` | Runs full research pipelines (plan → search → synthesize) | User query + live search results |
| **FollowUpAgent** | `backend/followup_agent.py` | Answers follow-up questions on completed reports | Completed report + chat history |

**Why?** The research agent uses tool-calling (web search, arXiv) and streaming. The follow-up agent is a simple stateless Q&A call. Mixing them would create coupling between the research pipeline and the conversational flow. Isolation means either can be swapped, upgraded, or rate-limited independently.

---

### 2. OpenRouter as LLM Gateway

Instead of calling OpenAI, Anthropic, or Google directly, all LLM calls go through **[OpenRouter](https://openrouter.ai)**:

```python
self.client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key or os.getenv("OPENROUTER_API_KEY"),
)
```

**Why?**
- **Model flexibility** — switch between providers (GPT, Claude, Gemini, open-source) by changing a single string
- **Free tier available** — current model (`arcee-ai/trinity-large-preview:free`) costs $0
- **Per-user API keys** — each user brings their own key, stored in their account

---

### 3. Dual Search Strategy (Web + Academic)

The research agent uses a **planning step** before searching:

```
User Query → LLM Planning → "web" / "arxiv" / "both" / "none"
                           → optimized search queries
```

- **DuckDuckGo** (`duckduckgo-search`) — general knowledge, current events
- **arXiv** (`arxiv` library) — peer-reviewed scientific papers

**Why not Google/Bing APIs?** DuckDuckGo requires no API key and has no rate limits for development. arXiv's API is free and public. This keeps the setup zero-cost.

---

### 4. JWT Authentication (Stateless, Multi-Tenant)

```
Signup → password hashed (Werkzeug scrypt) → stored in SQLite
Login  → JWT issued (Flask-JWT-Extended, 24h expiry)
Requests → Bearer token in Authorization header
```

**Why JWT over sessions?**
- Stateless — no server-side session store needed
- Multi-tenant by design — every query is filtered by `user_id` from the token
- Frontend stores token in `localStorage`, attaches via `Authorization: Bearer <token>`

**Security decisions:**
- Passwords hashed with `werkzeug.security.generate_password_hash` (scrypt)
- All research/chat endpoints protected with `@jwt_required()`
- Data access strictly scoped: `ResearchRun.query.filter_by(user_id=user_id)`

---

### 5. SQLite with SQLAlchemy ORM (No Migrations)

**Schema** (5 tables):

```
users ─┐
       ├── research_runs ──┬── agent_logs
       │                   ├── citations
       │                   └── follow_up_messages
```

All child tables use `cascade="all, delete-orphan"` — deleting a user cascades to their runs, which cascades to logs, citations, and chat messages.

**Why no Alembic migrations?** This is a development/assignment project. The schema is simple enough that `db.create_all()` on startup handles table creation. For production, Alembic would be added.

---

### 6. Asynchronous Research via Background Threads

Research jobs run in a **background thread**, not in the request handler:

```python
@app.post("/api/research")
def start_research():
    run = ResearchRun(...)  # Create DB record
    thread = threading.Thread(target=run_agent, args=(run.id,))
    thread.start()
    return jsonify({"run_id": run.id})  # Return immediately
```

The frontend **polls** `GET /api/research/<id>` every 1.5s to check status and fetch logs.

**Why polling over WebSockets?** Simpler to implement, debug, and deploy. The polling interval (1.5s) is fast enough for the UX. WebSockets would be an optimization for production.

---

### 7. Frontend Environment Variables (No Hardcoded URLs)

The API base URL is configurable via Vite environment variables:

```typescript
// api.ts — single source of truth
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
```

All files (`AuthContext.tsx`, `SettingsPage.tsx`) import from this single export. A `.env.example` documents the required variables.

---

### 8. Responsive Layout (Mobile → Desktop)

The 3-panel layout adapts across breakpoints using **Tailwind CSS responsive prefixes only** (no additional libraries):

| Breakpoint | Sidebar | Main Content | Action Log |
|------------|---------|-------------|------------|
| **Mobile** (< 768px) | Hidden → hamburger overlay | 100% width | Hidden or bottom drawer |
| **Tablet** (768–1024px) | Icon rail (w-14) | Full remaining width | Icon rail (w-14) |
| **Desktop** (> 1024px) | Hover-expand (w-14 → w-64) | Flexible center | Hover-expand (w-14 → w-72) |

---

## Project Structure

```
research-agent/
├── backend/
│   ├── app.py              # Flask REST API (auth + research + chat endpoints)
│   ├── agent.py            # ResearchAgent (planning → search → synthesis)
│   ├── followup_agent.py   # Isolated follow-up Q&A agent
│   ├── tools.py            # DuckDuckGo + arXiv search functions
│   ├── models.py           # SQLAlchemy models (5 tables)
│   ├── schemas.py          # Pydantic request validation
│   ├── database.py         # SQLAlchemy init
│   └── .env                # OPENROUTER_API_KEY, JWT_SECRET_KEY
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Root layout + state management
│   │   ├── api.ts              # API client (all fetch calls + auth headers)
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # JWT token management
│   │   └── components/
│   │       ├── LoginPage.tsx    # Auth UI (login + signup)
│   │       ├── Header.tsx       # Top bar + hamburger + avatar dropdown
│   │       ├── Sidebar.tsx      # History + navigation (mobile overlay)
│   │       ├── InputForm.tsx    # Research query input
│   │       ├── ProcessingView.tsx  # Pipeline progress + skeletons
│   │       ├── CompletedView.tsx   # Report + citations + follow-up chat
│   │       ├── ActionLog.tsx    # Observability feed (side panel / bottom drawer)
│   │       └── SettingsPage.tsx # Password + API key management
│   └── .env.example        # VITE_API_BASE_URL
│
└── README.md
```

---

## Quick Start

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your OPENROUTER_API_KEY
python app.py          # Runs on :5001

# Frontend (in a new terminal)
cd ../frontend
npm install
cp .env.example .env
npm run dev            # Runs on :5173
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18, Vite, TypeScript | Fast dev server, type safety |
| **Styling** | Tailwind CSS | Utility-first, responsive prefixes |
| **Icons** | Lucide React | Tree-shakeable, consistent |
| **Markdown** | react-markdown + remark-gfm | Render LLM output as formatted HTML |
| **Backend** | Flask, Python 3.13 | Lightweight, easy threading |
| **Auth** | Flask-JWT-Extended | Stateless token auth |
| **ORM** | Flask-SQLAlchemy | Simple model definitions |
| **Validation** | Pydantic v2 | Schema validation with clear errors |
| **Database** | SQLite | Zero-config, single file, enough for dev |
| **LLM** | OpenRouter (OpenAI SDK) | Multi-provider gateway, free models |
| **Search** | DuckDuckGo, arXiv | Free, no API keys required |
