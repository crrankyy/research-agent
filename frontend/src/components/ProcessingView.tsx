import React from 'react';
import type { AppState } from '../types';

interface ProcessingViewProps {
    appState: AppState;
    query: string;
    progress: number;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ appState, query, progress }) => {
    const isSearching = appState === 'processing' && progress < 60;
    const isAnalyzing = appState === 'processing' && progress >= 60;
    const isSynthesizing = appState === 'synthesizing';

    return (
        <main className="flex-1 flex flex-col relative bg-zinc-950">
            {/* Progress header */}
            <div className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm p-4 md:p-8 z-10 sticky top-0">
                <div className="max-w-4xl mx-auto w-full">
                    {/* Title row */}
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono">
                                    ID: #REQ-9928-A
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono">
                                    PRIORITY: HIGH
                                </span>
                            </div>
                            <h2 className="text-lg md:text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
                                Researching: <span className="text-zinc-400">{query}</span>
                            </h2>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-amber-400 font-mono">{progress}%</span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mb-6">
                        <div
                            className="bg-amber-400 h-full relative overflow-hidden transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 animate-shimmer" />
                        </div>
                    </div>

                    {/* Pipeline cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                        {/* Search */}
                        <div
                            className={`flex flex-col gap-2 p-3 rounded-lg bg-zinc-900/40 ${isSearching
                                ? 'border border-amber-500/20'
                                : isAnalyzing || isSynthesizing
                                    ? 'border border-emerald-500/20'
                                    : 'border border-zinc-800/50 opacity-50'
                                }`}
                        >
                            <div
                                className={`flex items-center justify-between text-xs font-medium uppercase tracking-wider ${isSearching ? 'text-amber-400' : isAnalyzing || isSynthesizing ? 'text-emerald-400' : 'text-zinc-500'
                                    }`}
                            >
                                <span>Search</span>
                                <span className="text-[16px]">{isSearching ? '🔍' : isAnalyzing || isSynthesizing ? '✓' : '🔍'}</span>
                            </div>
                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${isSearching ? 'bg-amber-400 w-3/4' : isAnalyzing || isSynthesizing ? 'bg-emerald-400 w-full' : 'bg-zinc-700 w-0'
                                        }`}
                                />
                            </div>
                            <p className={`text-[10px] ${isSearching ? 'text-zinc-400' : isAnalyzing || isSynthesizing ? 'text-emerald-400/60' : 'text-zinc-500'}`}>
                                {isSearching ? 'Querying external sources...' : isAnalyzing || isSynthesizing ? 'Complete' : 'Querying external sources...'}
                            </p>
                        </div>

                        {/* Analysis */}
                        <div
                            className={`flex flex-col gap-2 p-3 rounded-lg bg-zinc-900/40 ${isAnalyzing
                                ? 'border border-amber-500/20'
                                : isSynthesizing
                                    ? 'border border-emerald-500/20'
                                    : 'border border-zinc-800/50 opacity-50'
                                }`}
                        >
                            <div
                                className={`flex items-center justify-between text-xs font-medium uppercase tracking-wider ${isAnalyzing ? 'text-amber-400' : isSynthesizing ? 'text-emerald-400' : 'text-zinc-500'
                                    }`}
                            >
                                <span>Analysis</span>
                                <span className="text-[16px]">{isAnalyzing ? '📊' : isSynthesizing ? '✓' : '📊'}</span>
                            </div>
                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${isAnalyzing ? 'bg-amber-400 w-1/2' : isSynthesizing ? 'bg-emerald-400 w-full' : 'bg-zinc-700 w-0'
                                        }`}
                                />
                            </div>
                            <p className={`text-[10px] ${isAnalyzing ? 'text-zinc-400' : isSynthesizing ? 'text-emerald-400/60' : 'text-zinc-500'}`}>
                                {isAnalyzing ? 'Analyzing patterns...' : isSynthesizing ? 'Complete' : 'Waiting for data...'}
                            </p>
                        </div>

                        {/* Synthesis */}
                        <div
                            className={`flex flex-col gap-2 p-3 rounded-lg bg-zinc-900/40 ${isSynthesizing ? 'border border-amber-500/20' : 'border border-zinc-800/50 opacity-50'
                                }`}
                        >
                            <div
                                className={`flex items-center justify-between text-xs font-medium uppercase tracking-wider ${isSynthesizing ? 'text-amber-400' : 'text-zinc-500'
                                    }`}
                            >
                                <span>Synthesis</span>
                                <span className="text-[16px]">{isSynthesizing ? '📝' : '📝'}</span>
                            </div>
                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${isSynthesizing ? 'bg-amber-400 w-2/3' : 'bg-zinc-700 w-0'
                                        }`}
                                />
                            </div>
                            <p className={`text-[10px] ${isSynthesizing ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                {isSynthesizing ? 'Generating report...' : 'Report generation...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Skeleton loading area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Text skeleton */}
                    <div className="space-y-4">
                        <div className="h-6 w-1/3 bg-zinc-900 rounded animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-zinc-900 rounded animate-pulse" />
                            <div className="h-4 w-5/6 bg-zinc-900 rounded animate-pulse" />
                            <div className="h-4 w-4/6 bg-zinc-900 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Card skeletons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-4 border border-zinc-800 bg-zinc-900/30 rounded-lg space-y-3">
                                <div className="flex justify-between">
                                    <div className="h-4 w-24 bg-zinc-900 rounded animate-pulse" />
                                    <div className="h-4 w-8 bg-zinc-900 rounded animate-pulse" />
                                </div>
                                <div className="space-y-2 mt-2">
                                    <div className="h-3 w-full bg-zinc-900 rounded animate-pulse" />
                                    <div className="h-3 w-5/6 bg-zinc-900 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom section skeleton */}
                    <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                        <div className="h-6 w-1/4 bg-zinc-900 rounded animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-20 w-full bg-zinc-900 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ProcessingView;
