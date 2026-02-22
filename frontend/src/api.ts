/**
 * API client for the research agent backend.
 * All research endpoints attach a JWT Bearer token from localStorage.
 */

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// ─── Auth header helper ────────────────────────────────────────

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Types from backend ────────────────────────────────────────

export interface CreateRunResponse {
    id: string;
    status: string;
}

export interface CitationDTO {
    id: number;
    run_id: string;
    title: string;
    url: string;
    source_type: 'WEB' | 'ARXIV' | 'PDF';
}

export interface ResearchRunDTO {
    id: string;
    user_query: string;
    status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    final_report: string | null;
    error_message: string | null;
    citations: CitationDTO[];
    created_at: string;
    updated_at: string;
}

export interface ResearchRunSummaryDTO {
    id: string;
    user_query: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface AgentLogDTO {
    id: number;
    run_id: string;
    action_type: string;
    details: string;
    created_at: string;
}

// ─── API functions ─────────────────────────────────────────────

export async function startResearch(query: string): Promise<CreateRunResponse> {
    const res = await fetch(`${API_BASE}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ query }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

export async function getResearchRun(id: string): Promise<ResearchRunDTO> {
    const res = await fetch(`${API_BASE}/api/research/${id}`, {
        headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function getResearchLogs(id: string): Promise<AgentLogDTO[]> {
    const res = await fetch(`${API_BASE}/api/research/${id}/logs`, {
        headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function listResearchRuns(): Promise<ResearchRunSummaryDTO[]> {
    const res = await fetch(`${API_BASE}/api/research`, {
        headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// ─── Follow-up chat ────────────────────────────────────────────

export interface FollowUpMessageDTO {
    id: number;
    run_id: string;
    role: 'user' | 'agent';
    content: string;
    created_at: string;
}

export async function sendFollowUp(runId: string, message: string): Promise<FollowUpMessageDTO[]> {
    const res = await fetch(`${API_BASE}/api/research/${runId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ message }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.messages;
}

export async function getFollowUpMessages(runId: string): Promise<FollowUpMessageDTO[]> {
    const res = await fetch(`${API_BASE}/api/research/${runId}/chat`, {
        headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
