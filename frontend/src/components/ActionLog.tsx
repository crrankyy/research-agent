import React, { useState } from 'react';
import {
    Activity,
    StopCircle,
    FileText,
    AlertCircle,
    Search,
    CheckCircle,
    Brain,
    Clock,
    RefreshCw,
    ChevronUp,
    X,
} from 'lucide-react';
import type { AgentAction, AppState } from '../types';

interface ActionLogProps {
    appState: AppState;
    actions: AgentAction[];
    onStop: () => void;
}

const actionIconMap: Record<AgentAction['type'], React.FC<{ className?: string }>> = {
    processing: FileText,
    error: AlertCircle,
    search: Search,
    success: CheckCircle,
    reasoning: Brain,
    queued: Clock,
    info: Activity,
    status: Activity,
    plan: Brain,
};

const actionColorMap: Record<AgentAction['type'], string> = {
    processing: 'text-amber-400',
    error: 'text-red-400',
    search: 'text-blue-400',
    success: 'text-emerald-400',
    reasoning: 'text-purple-400',
    queued: 'text-zinc-500',
    info: 'text-zinc-400',
    status: 'text-zinc-400',
    plan: 'text-purple-400',
};

const actionBorderMap: Record<AgentAction['type'], string> = {
    processing: 'border-l-amber-400',
    error: 'border-l-red-500/50',
    search: 'border-l-zinc-700',
    success: 'border-l-zinc-700',
    reasoning: 'border-l-zinc-700',
    queued: 'border-l-zinc-700',
    info: 'border-l-zinc-700',
    status: 'border-l-zinc-700',
    plan: 'border-l-zinc-700',
};

const ActionLog: React.FC<ActionLogProps> = ({ appState, actions, onStop }) => {
    const alwaysExpanded = appState === 'processing' || appState === 'synthesizing';

    if (alwaysExpanded) {
        return <LiveActionLog actions={actions} onStop={onStop} />;
    }

    // idle and completed: collapsed by default, expand on hover (desktop only)
    return <HoverableActionLog appState={appState} actions={actions} />;
};

/* ──────────────── Hoverable (idle + completed): hidden on mobile, collapsed ↔ expanded on hover at lg+ ──────────────── */

const HoverableActionLog: React.FC<{ appState: AppState; actions: AgentAction[] }> = ({
    appState,
    actions,
}) => {
    const [hovered, setHovered] = useState(false);

    return (
        <aside
            className={`hidden md:flex border-l border-zinc-800/50 backdrop-blur-md bg-zinc-900/40 flex-col shrink-0 z-20 transition-all duration-300 overflow-hidden ${hovered ? 'lg:w-72 w-14' : 'w-14'}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {hovered ? (
                /* ── Expanded content (lg+ only due to width) ── */
                <div className="hidden lg:flex flex-col flex-1">
                    <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
                        <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-zinc-400" />
                            Action Log
                        </h3>
                        {appState === 'completed' && (
                            <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-400/20">
                                Done
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {appState === 'idle' ? (
                            <IdleContent />
                        ) : (
                            <CompletedContent actions={actions} />
                        )}
                    </div>
                </div>
            ) : null}

            {/* Collapsed: single icon (visible on md) */}
            {!hovered && (
                <div className="py-4 flex flex-col items-center">
                    <button
                        className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                        title="Action Log"
                    >
                        <Activity className="w-4 h-4" />
                    </button>
                </div>
            )}
            {/* Show icon on md when hovered but not lg */}
            {hovered && (
                <div className="lg:hidden py-4 flex flex-col items-center">
                    <button
                        className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                        title="Action Log"
                    >
                        <Activity className="w-4 h-4" />
                    </button>
                </div>
            )}
        </aside>
    );
};

/* ── Idle expanded content ── */

const IdleContent: React.FC = () => (
    <>
        <div className="flex items-start gap-3 p-3 rounded backdrop-blur-md bg-zinc-900/40 border border-zinc-800/60">
            <div className="mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <div>
                <p className="text-xs font-medium text-emerald-500 mb-1">System Ready</p>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                    All agents are online and awaiting instruction.
                </p>
            </div>
        </div>
        <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 opacity-40">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <div className="h-2 bg-zinc-800 rounded w-24" />
            </div>
            <div className="flex items-center gap-3 opacity-30">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <div className="h-2 bg-zinc-800 rounded w-32" />
            </div>
        </div>
    </>
);

/* ── Completed expanded content: shows summary of past actions ── */

const CompletedContent: React.FC<{ actions: AgentAction[] }> = ({ actions }) => {
    const displayActions = [...actions].filter(Boolean).reverse();

    return (
        <>
            <div className="flex items-start gap-3 p-3 rounded backdrop-blur-md bg-zinc-900/40 border border-emerald-500/20">
                <div className="mt-0.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                    <p className="text-xs font-medium text-emerald-400 mb-1">Research Complete</p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                        {actions.length} events processed
                    </p>
                </div>
            </div>

            <div className="mt-2 space-y-1.5">
                {displayActions.map((action) => {
                    const Icon = actionIconMap[action.type];
                    const colorClass = actionColorMap[action.type];
                    return (
                        <div
                            key={action.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded text-zinc-500 hover:bg-zinc-800/30 transition-colors"
                        >
                            <Icon className={`w-3.5 h-3.5 ${colorClass} shrink-0`} />
                            <span className="text-[11px] truncate">{action.title}</span>
                            <span className="text-[9px] font-mono text-zinc-600 ml-auto shrink-0">
                                {action.timestamp}
                            </span>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

/* ── Action list shared component ── */

const ActionList: React.FC<{ actions: AgentAction[] }> = ({ actions }) => {
    const displayActions = [...actions].filter(Boolean).reverse();
    return (
        <div className="space-y-3">
            {displayActions.map((action, index) => {
                const Icon = actionIconMap[action.type];
                const colorClass = actionColorMap[action.type];
                const borderClass = actionBorderMap[action.type];
                const isLatest = index === 0;
                const opacityClass = isLatest
                    ? ''
                    : index === 1
                        ? 'opacity-80'
                        : index === 2
                            ? 'opacity-60'
                            : index === 3
                                ? 'opacity-50'
                                : index === 4
                                    ? 'opacity-40'
                                    : 'opacity-30';

                if (isLatest && action.type === 'processing') {
                    return (
                        <div
                            key={action.id}
                            className={`glass-card p-4 rounded-lg border-l-2 ${borderClass} relative overflow-hidden group`}
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-50">
                                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            </div>
                            <div className="flex gap-3 relative z-10">
                                <div className={`mt-0.5 ${colorClass} shrink-0`}>
                                    <Icon className="w-[18px] h-[18px]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white">{action.title}</p>
                                    <p className="text-xs text-zinc-400 mt-1">{action.description}</p>
                                    {action.tags && (
                                        <div className="mt-2 flex gap-2">
                                            {action.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3 pt-2 border-t border-zinc-800 flex justify-between items-center">
                                <span className="text-[10px] font-mono text-amber-400">Processing</span>
                                <span className="text-[10px] font-mono text-zinc-500">{action.timestamp}</span>
                            </div>
                        </div>
                    );
                }

                return (
                    <div
                        key={action.id}
                        className={`glass-card p-3 rounded-lg border-l-2 ${borderClass} ${opacityClass}`}
                    >
                        <div className="flex gap-3">
                            <div className={`mt-0.5 ${colorClass} shrink-0`}>
                                <Icon className="w-[18px] h-[18px]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-zinc-300">{action.title}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{action.description}</p>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-600 shrink-0">
                                {action.timestamp}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* ──────────────────────── Live (processing + synthesizing) ────────────────────── */

const LiveActionLog: React.FC<{ actions: AgentAction[]; onStop: () => void }> = ({
    actions,
    onStop,
}) => {
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    return (
        <>
            {/* Desktop: side panel */}
            <aside className="hidden md:flex w-80 lg:w-96 border-l border-zinc-800 bg-zinc-950 flex-col shrink-0 z-20">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <Activity className="w-[18px] h-[18px] text-amber-400" />
                        Action Log
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-400/20">
                        Live
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto bg-zinc-950/50 p-4">
                    <ActionList actions={actions} />
                </div>

                <div className="p-4 border-t border-zinc-800 bg-zinc-950 mt-auto">
                    <div className="flex justify-between items-center text-xs text-zinc-500 mb-3 font-mono">
                        <span>{actions.length} EVENTS</span>
                    </div>
                    <button
                        onClick={onStop}
                        className="w-full py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-md text-xs font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                        <StopCircle className="w-4 h-4" />
                        Stop Process
                    </button>
                </div>
            </aside>

            {/* Mobile: bottom drawer */}
            <div className="md:hidden">
                {/* Collapsed tab */}
                {!mobileDrawerOpen && (
                    <button
                        onClick={() => setMobileDrawerOpen(true)}
                        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 border-t border-zinc-800 text-zinc-300"
                    >
                        <ChevronUp className="w-4 h-4" />
                        <Activity className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-medium">Action Log</span>
                        <span className="text-[10px] font-mono text-zinc-500">{actions.length} events</span>
                    </button>
                )}

                {/* Expanded drawer */}
                {mobileDrawerOpen && (
                    <div className="fixed inset-0 z-50">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setMobileDrawerOpen(false)}
                        />
                        <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-zinc-950 border-t border-zinc-800 rounded-t-2xl flex flex-col">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
                                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-amber-400" />
                                    Action Log
                                    <span className="inline-flex items-center rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-inset ring-amber-400/20 ml-1">
                                        Live
                                    </span>
                                </h3>
                                <button
                                    onClick={() => setMobileDrawerOpen(false)}
                                    className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                <ActionList actions={actions} />
                            </div>
                            <div className="p-4 border-t border-zinc-800 shrink-0">
                                <button
                                    onClick={onStop}
                                    className="w-full py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-md text-xs font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                >
                                    <StopCircle className="w-4 h-4" />
                                    Stop Process
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ActionLog;
