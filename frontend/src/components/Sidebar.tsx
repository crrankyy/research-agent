import React, { useState } from 'react';
import { Plus, Clock, Settings, X } from 'lucide-react';
import type { AppState, HistoryItem } from '../types';

interface SidebarProps {
    appState: AppState;
    onNewAnalysis: () => void;
    historyItems: HistoryItem[];
    onSelectRun?: (runId: string) => void;
    onSettings?: () => void;
    mobileOpen?: boolean;
    onCloseMobile?: () => void;
}

/* ─── Sub-components ─── */

const CollapsedHistory: React.FC<{ items: HistoryItem[]; onSelect?: (id: string) => void }> = ({ items, onSelect }) => (
    <nav className="flex flex-col gap-3 w-full items-center">
        {items.map((item) => (
            <button
                key={item.id}
                onClick={() => onSelect?.(item.id)}
                className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-200 rounded hover:bg-zinc-800/30 hover:backdrop-blur-sm transition-all duration-200 relative group"
            >
                <Clock className="w-4 h-4" />
                <span className="absolute left-10 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity shadow-sm">
                    {item.title}
                </span>
            </button>
        ))}
    </nav>
);

const ExpandedHistory: React.FC<{ items: HistoryItem[]; onSelect?: (id: string) => void }> = ({ items, onSelect }) => (
    <div>
        <h3 className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            History
        </h3>
        <nav className="space-y-0.5">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onSelect?.(item.id)}
                    className="w-full group flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 rounded-md hover:bg-white/5 hover:backdrop-blur-sm transition-colors text-left"
                >
                    <Clock className="w-[18px] h-[18px] text-zinc-600 shrink-0" />
                    <span className="truncate">{item.title}</span>
                </button>
            ))}
        </nav>
    </div>
);

/* ─── Sidebar content (shared by desktop rail and mobile overlay) ─── */

const SidebarContent: React.FC<{
    expanded: boolean;
    historyItems: HistoryItem[];
    onNewAnalysis: () => void;
    onSelectRun?: (id: string) => void;
    onSettings?: () => void;
}> = ({ expanded, historyItems, onNewAnalysis, onSelectRun, onSettings }) => (
    <>
        {/* New button */}
        <div className={`${expanded ? 'p-4' : 'py-4 flex flex-col items-center'}`}>
            {expanded ? (
                <button
                    onClick={onNewAnalysis}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 py-2 px-4 rounded-md text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Analysis
                </button>
            ) : (
                <button
                    onClick={onNewAnalysis}
                    className="w-8 h-8 flex items-center justify-center bg-zinc-100 text-zinc-950 rounded shadow-sm hover:bg-white transition-colors"
                    title="New Research"
                >
                    <Plus className="w-4 h-4" />
                </button>
            )}
        </div>

        {/* Divider */}
        {!expanded && <div className="w-8 h-[1px] bg-zinc-800 mx-auto" />}

        {/* History items */}
        <div className={`flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${expanded ? 'px-3 py-2' : 'py-3'}`}>
            {expanded ? (
                <ExpandedHistory items={historyItems} onSelect={onSelectRun} />
            ) : (
                <CollapsedHistory items={historyItems} onSelect={onSelectRun} />
            )}
        </div>

        {/* Settings */}
        <div className={`border-t border-zinc-800 bg-zinc-950 ${expanded ? 'p-4' : 'py-4 flex flex-col items-center'}`}>
            {expanded ? (
                <div
                    onClick={onSettings}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-900 cursor-pointer transition-colors text-zinc-400 hover:text-zinc-200"
                >
                    <Settings className="w-[18px] h-[18px]" />
                    <span className="text-sm font-medium">Settings</span>
                </div>
            ) : (
                <button
                    onClick={onSettings}
                    className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-200 rounded hover:bg-zinc-800 transition-colors"
                    title="Settings"
                >
                    <Settings className="w-4 h-4" />
                </button>
            )}
        </div>
    </>
);

/* ─── Main Sidebar ─── */

const Sidebar: React.FC<SidebarProps> = ({
    appState,
    onNewAnalysis,
    historyItems,
    onSelectRun,
    onSettings,
    mobileOpen,
    onCloseMobile,
}) => {
    const [hovered, setHovered] = useState(false);
    const canExpand = appState === 'idle' || appState === 'completed';
    // Hover-expand only at lg+ (controlled via JS; CSS hides the rail on mobile)
    const expanded = canExpand && hovered;

    return (
        <>
            {/* Desktop / Tablet: icon rail, hover-expand at lg */}
            <aside
                className={`hidden md:flex border-r border-zinc-800 bg-zinc-950 flex-col shrink-0 z-20 transition-all duration-300 overflow-hidden ${expanded ? 'lg:w-64 w-14' : 'w-14'}`}
                onMouseEnter={() => canExpand && setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <SidebarContent
                    expanded={expanded}
                    historyItems={historyItems}
                    onNewAnalysis={onNewAnalysis}
                    onSelectRun={onSelectRun}
                    onSettings={onSettings}
                />
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onCloseMobile}
                    />
                    {/* Slide-in panel */}
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col animate-in slide-in-from-left duration-200">
                        {/* Close button */}
                        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0">
                            <span className="font-semibold text-sm text-zinc-100">Menu</span>
                            <button
                                onClick={onCloseMobile}
                                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <SidebarContent
                            expanded={true}
                            historyItems={historyItems}
                            onNewAnalysis={() => { onCloseMobile?.(); onNewAnalysis(); }}
                            onSelectRun={(id) => { onCloseMobile?.(); onSelectRun?.(id); }}
                            onSettings={() => { onCloseMobile?.(); onSettings?.(); }}
                        />
                    </aside>
                </div>
            )}
        </>
    );
};

export default Sidebar;
