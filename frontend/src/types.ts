export type AppState = 'idle' | 'processing' | 'synthesizing' | 'completed' | 'failed' | 'settings';

export interface AgentAction {
    id: string;
    type: 'info' | 'search' | 'error' | 'success' | 'reasoning' | 'queued' | 'processing' | 'status' | 'plan';
    title: string;
    description: string;
    timestamp: string;
    tags?: string[];
}

export interface HistoryItem {
    id: string;
    title: string;
}

export interface Source {
    id: string;
    title: string;
    url: string;
    publisher: string;
    type: 'PDF' | 'WEB' | 'ARXIV';
}

export interface Citation {
    id: number;
    title: string;
    url: string;
    source_type: 'WEB' | 'ARXIV' | 'PDF';
}
