# Project Guidelines: AI Research Agent

This document outlines the core architectural principles, design guidelines, and technical constraints that must be followed when extending or modifying the AI Research Agent project.

---

## 1. Frontend Architecture & Design

### Layout & Structure
The frontend is a single-page dashboard strictly divided into defined functional areas to emulate enterprise developer tools (e.g., Linear, Vercel).
- **Left Sidebar (History):** Lists previous queries. Expandable on hover (desktop), overlay on mobile.
- **Main Area (Interaction/Output):** Input field at the bottom, results view in the center.
- **Right Panel (Observability):** Chronological "Action Log" showing the agent's real-time thought process.

### UI/UX Fidelity
- **Palette:** Rely strictly on a monochrome Slate/Zinc palette in Dark Mode. Use exactly one accent color (e.g., Emerald) sparingly for primary actions or "Success/Completed" states.
- **Typography:** System sans-serif (Inter style) with generous line heights in the reading views to enhance legibility.
- **Delineation:** Use subtle 1px borders (e.g., `border-zinc-800`) to strictly separate layout regions. Avoid heavy drop shadows. Do not alter the layout geometry.

### Component & State Management
- **Simplicity over Cleverness:** Avoid complex global state libraries like Redux or Zustand. Rely cleanly on native React hooks (`useState`, `useContext`, `useRef`).
- **Granular Components:** Build logical, modular components (e.g., `Sidebar.tsx`, `Header.tsx`, `ActionLog.tsx`).
- **Core App States:** The application state machine strictly pivots around: `idle`, `processing`, `synthesizing`, and `completed`. 

### Interface Safety & Observability
- **Prevent Duplication:** The input area and submit buttons *must* physically disable when the application state is anything other than `idle`.
- **Chronological Feed:** The right panel must provide detailed real-time logs (e.g., searching, parsing, errors) using clear icons to indicate the agent's current stage.
- **Auto-Scrolling:** The observability feed must auto-scroll so the newest agent action is always visible.

---

## 2. Backend Architecture & Strategy

### LLM Agent Isolation
- **Strict Separation of Concerns:** Use separate, isolated logic for distinct LLM tasks. 
  - The `ResearchAgent` handles planning, tool utilization (search), and primary synthesis.
  - The `FollowUpAgent` is a lightweight, stateless Q&A assistant restricted to discussing the final report.
- Do not mix the asynchronous tool-calling pipeline with the synchronous chat completion pipeline.

### Model Provisioning
- **Gateway Pattern:** Use OpenRouter as the API gateway for all LLM calls. This prevents vendor lock-in and allows seamless switching between open-source models, Anthropic, or OpenAI.
- **Cost Efficiency:** Prioritize highly capable free-tier models (e.g., `arcee-ai/trinity-large-preview:free`) for development.

### Search Strategy
- **Dual Verification:** The agent queries both general web indices (DuckDuckGo, for current context) and academic repositories (arXiv, for peer-reviewed data).
- **Intelligent Routing:** Ask an LLM to decide whether a query needs web search, academic search, both, or neither, before actually executing the search.

### Execution & Concurrency
- **Asynchronous Workers:** LLM generation and tool use are slow. Process research tasks in background threads. Do not block the main HTTP request loop.
- **Client Polling:** Have the client poll the backend for status updates (`/api/research/<id>`) rather than maintaining complex WebSocket state, to ensure horizontal scalability and simplicity.

---

## 3. Data & Security Protocols

### Authentication
- Use stateless, short-lived JWTs (JSON Web Tokens) sent in the HTTP `Authorization: Bearer` header. Do not rely on server-side session stores.
- Passwords must be hashed using strictly secure, modern algorithms (e.g., scrypt via Werkzeug).

### Multi-Tenancy
- Every database query returning user data *must* filter by the authenticated user's ID (`user_id`). 
- Maintain strict database cascading (e.g., deleting a user inherently deletes their logs, queries, and auth state).

### Environment Configuration
- **No Hardcoded Values:** Never hardcode API keys, secrets, or URLs.
- Backend configuration must rely on a `.env` file (never committed to Git).
- Frontend configuration must rely on Vite environment variables (e.g., `import.meta.env.VITE_API_BASE_URL`), with a fallback constant solely for rapid local dev bootstrapping.
