import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import InputForm from './components/InputForm';
import ProcessingView from './components/ProcessingView';
import CompletedView from './components/CompletedView';
import ActionLog from './components/ActionLog';
import LoginPage from './components/LoginPage';
import SettingsPage from './components/SettingsPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { AppState, AgentAction, HistoryItem, Citation } from './types';
import { startResearch, getResearchRun, getResearchLogs, listResearchRuns } from './api';
import type { AgentLogDTO } from './api';

const POLL_INTERVAL = 1500; // ms

const Dashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const [appState, setAppState] = useState<AppState>('idle');
  const [query, setQuery] = useState('');
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [runId, setRunId] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  const pollRef = useRef<number | null>(null);
  const elapsedRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const previousStateRef = useRef<AppState>('idle');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Fetch sidebar history on mount ────────────────────────
  useEffect(() => {
    listResearchRuns()
      .then((runs) => {
        setHistoryItems(
          runs.map((r) => ({
            id: r.id,
            title: r.user_query.length > 25 ? r.user_query.slice(0, 25) + '...' : r.user_query,
          }))
        );
      })
      .catch(() => { /* ignore on first load */ });
  }, [appState]);

  // ─── Elapsed time counter ──────────────────────────────────
  useEffect(() => {
    if (appState !== 'processing' && appState !== 'synthesizing') {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
      return;
    }

    if (!elapsedRef.current) {
      startTimeRef.current = Date.now();
      elapsedRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const secs = Math.floor(elapsed / 1000) % 60;
        const mins = Math.floor(elapsed / 60000) % 60;
        const hrs = Math.floor(elapsed / 3600000);
        setElapsedTime(
          `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      }, 1000);
    }

    return () => {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    };
  }, [appState]);

  // ─── Polling for run status & logs ─────────────────────────
  useEffect(() => {
    if (!runId || (appState !== 'processing' && appState !== 'synthesizing')) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const [run, logs] = await Promise.all([
          getResearchRun(runId),
          getResearchLogs(runId),
        ]);

        const mappedActions = mapLogsToActions(logs);
        setActions(mappedActions);

        const totalLogs = logs.length;
        if (run.status === 'IN_PROGRESS') {
          const hasChunks = logs.some((l) => l.action_type === 'response_chunk');
          if (hasChunks) {
            setAppState('synthesizing');
            setProgress(Math.min(60 + totalLogs, 95));
          } else {
            setAppState('processing');
            setProgress(Math.min(totalLogs * 10, 60));
          }
        } else if (run.status === 'COMPLETED') {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setProgress(100);
          setReport(run.final_report);
          setCitations(
            (run.citations || []).map((c) => ({
              id: c.id,
              title: c.title,
              url: c.url,
              source_type: c.source_type,
            }))
          );
          setAppState('completed');
        } else if (run.status === 'FAILED') {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setErrorMessage(run.error_message || 'An unknown error occurred');
          setAppState('failed');
        }
      } catch {
        // Network error — keep polling
      }
    };

    poll();
    pollRef.current = window.setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [runId, appState]);

  // ─── Submit handler ────────────────────────────────────────
  const handleSubmit = useCallback(async (q: string) => {
    setQuery(q);
    setAppState('processing');
    setActions([]);
    setProgress(0);
    setElapsedTime('00:00:00');
    setReport(null);
    setCitations([]);
    setErrorMessage(null);

    try {
      const { id } = await startResearch(q);
      setRunId(id);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to start research');
      setAppState('failed');
    }
  }, []);

  const handleNewAnalysis = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setAppState('idle');
    setQuery('');
    setActions([]);
    setProgress(0);
    setElapsedTime('00:00:00');
    setRunId(null);
    setReport(null);
    setCitations([]);
    setErrorMessage(null);
  }, []);

  const handleStop = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setAppState('idle');
    setQuery('');
    setActions([]);
    setProgress(0);
    setRunId(null);
  }, []);

  const handleSelectRun = useCallback(async (selectedRunId: string) => {
    try {
      const run = await getResearchRun(selectedRunId);
      if (run.status === 'COMPLETED') {
        setQuery(run.user_query);
        setReport(run.final_report);
        setCitations(
          (run.citations || []).map((c) => ({
            id: c.id,
            title: c.title,
            url: c.url,
            source_type: c.source_type,
          }))
        );
        setRunId(selectedRunId);
        setProgress(100);
        setErrorMessage(null);
        setActions([]);
        setAppState('completed');
      }
    } catch {
      // ignore fetch errors
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    previousStateRef.current = appState;
    setAppState('settings');
  }, [appState]);

  const handleBackFromSettings = useCallback(() => {
    setAppState(previousStateRef.current);
  }, []);

  return (
    <div className="bg-zinc-950 text-zinc-100 font-sans antialiased h-screen overflow-hidden flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <Header appState={appState} elapsedTime={elapsedTime} username={user?.username} onLogout={logout} onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar appState={appState} onNewAnalysis={handleNewAnalysis} historyItems={historyItems} onSelectRun={handleSelectRun} onSettings={handleOpenSettings} mobileOpen={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)} />

        {appState === 'settings' && <SettingsPage onBack={handleBackFromSettings} />}
        {appState === 'idle' && <InputForm appState={appState} onSubmit={handleSubmit} />}
        {(appState === 'processing' || appState === 'synthesizing') && (
          <ProcessingView appState={appState} query={query} progress={progress} />
        )}
        {appState === 'completed' && (
          <CompletedView
            query={query}
            report={report}
            citations={citations}
            runId={runId}
            onNewAnalysis={handleNewAnalysis}
          />
        )}
        {appState === 'failed' && (
          <main className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-8">
            <div className="max-w-lg w-full glass-card rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-zinc-100 mb-2">Research Failed</h2>
              <p className="text-sm text-zinc-400 mb-6">{errorMessage}</p>
              <button
                onClick={handleNewAnalysis}
                className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md text-sm font-medium hover:bg-white transition-colors"
              >
                Try Again
              </button>
            </div>
          </main>
        )}

        <ActionLog appState={appState} actions={actions} onStop={handleStop} />
      </div>
    </div>
  );
};

// ─── Root app: Auth gate ─────────────────────────────────────

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
};

const AuthGate: React.FC = () => {
  const { token } = useAuth();
  if (!token) return <LoginPage />;
  return <Dashboard />;
};

// ─── Helper: map backend logs to frontend AgentAction ────────

function mapLogsToActions(logs: AgentLogDTO[]): AgentAction[] {
  let actionCounter = 0;
  return logs
    .filter((l) => l.action_type !== 'response_chunk')
    .map((log) => {
      actionCounter++;
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(log.details || '{}');
      } catch { /* ignore */ }

      const actionType = mapActionType(log.action_type);
      const title = deriveTitle(log.action_type, parsed);
      const description = deriveDescription(log.action_type, parsed);
      const time = new Date(log.created_at);
      const timestamp = time.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      return {
        id: String(actionCounter),
        type: actionType,
        title,
        description,
        timestamp,
      };
    });
}

function mapActionType(backendType: string): AgentAction['type'] {
  switch (backendType) {
    case 'status': return 'info';
    case 'plan': return 'reasoning';
    case 'error': return 'error';
    default: return 'processing';
  }
}

function deriveTitle(type: string, parsed: Record<string, unknown>): string {
  if (type === 'status') return String(parsed.message || 'Processing...');
  if (type === 'plan') return 'Search plan created';
  if (type === 'error') return 'Error occurred';
  return String(parsed.message || type);
}

function deriveDescription(type: string, parsed: Record<string, unknown>): string {
  if (type === 'plan') {
    const tool = String(parsed.tool || 'unknown');
    const queries = Array.isArray(parsed.queries) ? parsed.queries : [];
    return `Tool: ${tool} | Queries: ${queries.join(', ')}`;
  }
  if (type === 'error') return String(parsed.message || 'Unknown error');
  return '';
}

export default App;
