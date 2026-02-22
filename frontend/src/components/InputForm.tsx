import React, { useState } from 'react';
import { ArrowRight, Paperclip, Globe, Microscope, Cpu, TrendingUp, ShieldAlert } from 'lucide-react';
import type { AppState } from '../types';

const suggestedTopics = [
    { label: 'CRISPR advancements', icon: 'Microscope' as const },
    { label: 'Neuromorphic computing', icon: 'Cpu' as const },
    { label: 'Solid-state batteries', icon: 'TrendingUp' as const },
    { label: 'Zero-day vulnerabilities', icon: 'ShieldAlert' as const },
];

interface InputFormProps {
    appState: AppState;
    onSubmit: (query: string) => void;
}

const iconMap = {
    Microscope,
    Cpu,
    TrendingUp,
    ShieldAlert,
} as const;

const hoverColorMap: Record<string, string> = {
    Microscope: 'group-hover:text-blue-400',
    Cpu: 'group-hover:text-emerald-400',
    TrendingUp: 'group-hover:text-purple-400',
    ShieldAlert: 'group-hover:text-orange-400',
};

const InputForm: React.FC<InputFormProps> = ({ appState, onSubmit }) => {
    const [query, setQuery] = useState('');
    const isDisabled = appState !== 'idle';

    const handleSubmit = () => {
        if (query.trim() && !isDisabled) {
            onSubmit(query.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleTopicClick = (topic: string) => {
        if (!isDisabled) {
            setQuery(topic);
            onSubmit(topic);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-2xl flex flex-col gap-6">
                {/* Heading */}
                <div className="text-center space-y-2 mb-2">
                    <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
                        What do you want to solve?
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        Initiate a deep-dive research session with autonomous agents.
                    </p>
                </div>

                {/* Input area */}
                <div className="relative group w-full">
                    <div className="relative bg-zinc-800/50 rounded-md border border-zinc-800 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all duration-200">
                        <textarea
                            className="w-full bg-transparent border-0 text-zinc-200 placeholder-zinc-600 focus:ring-0 resize-none py-4 px-5 min-h-[60px] text-base font-normal leading-relaxed outline-none"
                            placeholder="Ask anything..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isDisabled}
                        />
                        <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800/50">
                            <div className="flex items-center gap-1">
                                <button
                                    className="p-2 rounded hover:bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    title="Attach file"
                                    disabled={isDisabled}
                                >
                                    <Paperclip className="w-4 h-4" />
                                </button>
                                <button
                                    className="p-2 rounded hover:bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    title="Global Search"
                                    disabled={isDisabled}
                                >
                                    <Globe className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                className="flex items-center gap-2 bg-zinc-100 text-zinc-950 px-3 py-1.5 rounded text-xs font-semibold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleSubmit}
                                disabled={isDisabled || !query.trim()}
                            >
                                <ArrowRight className="w-3 h-3" />
                                Research
                            </button>
                        </div>
                    </div>
                </div>

                {/* Suggested topics */}
                <div className="space-y-3 pt-2">
                    <div className="text-xs text-center font-medium text-zinc-600 uppercase tracking-widest">
                        Suggested Topics
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {suggestedTopics.map((topic) => {
                            const Icon = iconMap[topic.icon];
                            return (
                                <button
                                    key={topic.label}
                                    onClick={() => handleTopicClick(topic.label)}
                                    disabled={isDisabled}
                                    className="px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon className={`w-3 h-3 text-zinc-500 ${hoverColorMap[topic.icon]} transition-colors`} />
                                    {topic.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InputForm;
