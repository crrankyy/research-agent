import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock, FileText, Layers, Sparkles, Bot, Send } from 'lucide-react';
import type { Citation } from '../types';
import { sendFollowUp, getFollowUpMessages } from '../api';
import type { FollowUpMessageDTO } from '../api';

interface CompletedViewProps {
    query: string;
    report: string | null;
    citations: Citation[];
    runId: string | null;
    onNewAnalysis: () => void;
}

const sourceBadgeColors: Record<string, { text: string; bg: string; border: string }> = {
    PDF: { text: 'text-emerald-400', bg: 'bg-emerald-950/50', border: 'border-emerald-900/50' },
    WEB: { text: 'text-blue-400', bg: 'bg-blue-950/50', border: 'border-blue-900/50' },
    ARXIV: { text: 'text-purple-400', bg: 'bg-purple-950/50', border: 'border-purple-900/50' },
};

interface ChatMessage {
    id: number | string;
    role: 'user' | 'agent';
    content: string;
    created_at?: string;
}

const CompletedView: React.FC<CompletedViewProps> = ({ query, report, citations, runId }) => {
    const wordCount = report ? report.split(/\s+/).length : 0;

    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Fetch existing follow-up messages when runId changes
    useEffect(() => {
        if (!runId) return;
        let cancelled = false;
        getFollowUpMessages(runId)
            .then((msgs) => {
                if (!cancelled) setChatMessages(msgs);
            })
            .catch(() => { /* silently ignore */ });
        return () => { cancelled = true; };
    }, [runId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = chatInput.trim();
        if (!msg || !runId || chatLoading) return;

        setChatInput('');
        setChatError(null);

        // Optimistically add user message
        const tempUserMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: msg,
        };
        setChatMessages((prev) => [...prev, tempUserMsg]);
        setChatLoading(true);

        try {
            const newMessages: FollowUpMessageDTO[] = await sendFollowUp(runId, msg);
            setChatMessages((prev) => {
                // Replace optimistic user message + add agent response
                const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
                return [...withoutTemp, ...newMessages];
            });
        } catch (err) {
            setChatError(err instanceof Error ? err.message : 'Failed to get response');
            // Remove optimistic message on error
            setChatMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <main className="flex-1 flex flex-col relative bg-zinc-950 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[1400px] mx-auto w-full px-4 md:px-8 py-6 md:py-10 flex gap-12">
                    {/* Sidebar: Agent insight */}
                    <aside className="w-64 hidden xl:block shrink-0 sticky top-6 h-fit">
                        {/* Agent insight card */}
                        <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-semibold text-zinc-50">Agent Insight</span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                This report synthesizes data from {citations.length} source{citations.length !== 1 ? 's' : ''}.
                                Powered by web and academic search.
                            </p>
                        </div>
                    </aside>

                    {/* Report content */}
                    <div className="flex-1 max-w-4xl mx-auto">
                        {/* Report header */}
                        <div className="mb-6 md:mb-8 border-b border-zinc-800 pb-4 md:pb-6">
                            <h1 className="text-xl md:text-3xl font-bold text-zinc-50 mb-3 md:mb-4 tracking-tight">
                                {query}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-zinc-500">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Just generated</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    <span>{wordCount.toLocaleString()} words</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Layers className="w-4 h-4" />
                                    <span>{citations.length} source{citations.length !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </div>

                        {/* Markdown article */}
                        <article className="prose-custom">
                            {report ? (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ children }) => <h2 className="text-2xl font-bold text-zinc-50 mt-8 mb-3">{children}</h2>,
                                        h2: ({ children }) => <h2 className="text-xl font-bold text-zinc-50 mt-8 mb-3">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-lg font-semibold text-zinc-100 mt-6 mb-2">{children}</h3>,
                                        p: ({ children }) => <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside text-zinc-300 mb-4 space-y-1">{children}</ol>,
                                        li: ({ children }) => <li className="text-zinc-300">{children}</li>,
                                        a: ({ href, children }) => (
                                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">
                                                {children}
                                            </a>
                                        ),
                                        strong: ({ children }) => <strong className="text-zinc-200 font-semibold">{children}</strong>,
                                        em: ({ children }) => <em className="text-zinc-300 italic">{children}</em>,
                                        blockquote: ({ children }) => (
                                            <blockquote className="border-l-2 border-emerald-500/50 pl-4 py-1 my-4 text-zinc-400 italic">{children}</blockquote>
                                        ),
                                        code: ({ children, className }) => {
                                            const isBlock = className?.includes('language-');
                                            if (isBlock) {
                                                return <code className="block bg-zinc-900 rounded-lg p-4 text-sm text-zinc-300 font-mono overflow-x-auto my-4">{children}</code>;
                                            }
                                            return <code className="bg-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
                                        },
                                    }}
                                >
                                    {report}
                                </ReactMarkdown>
                            ) : (
                                <p className="text-zinc-500 italic">No report content available.</p>
                            )}
                        </article>

                        {/* Citations */}
                        {citations.length > 0 && (
                            <div className="mt-16 pt-8 border-t border-zinc-800">
                                <h2 className="text-xl font-bold text-zinc-50 mb-6 flex items-center gap-2">
                                    📚 Referenced Sources
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {citations.map((cit) => {
                                        const badge = sourceBadgeColors[cit.source_type] || sourceBadgeColors.WEB;
                                        return (
                                            <a
                                                key={cit.id}
                                                href={cit.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group block bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden relative transition-all duration-300"
                                            >
                                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                                                <div className="h-24 bg-zinc-800 relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-90" />
                                                    <div className="absolute bottom-2 left-3 right-3">
                                                        <span
                                                            className={`text-[10px] font-bold ${badge.text} ${badge.bg} px-1.5 py-0.5 rounded border ${badge.border}`}
                                                        >
                                                            {cit.source_type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-4 relative z-0">
                                                    <h5 className="text-xs font-semibold text-zinc-200 line-clamp-2 mb-1 group-hover:text-emerald-400 transition-colors">
                                                        {cit.title}
                                                    </h5>
                                                    <p className="text-[10px] text-zinc-500 truncate">{cit.url}</p>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ─── Follow-up Chat ─────────────────────────────── */}
                        <div className="mt-16 pt-8 border-t border-zinc-800 mb-20">
                            <h2 className="text-lg font-semibold text-zinc-200 mb-6 flex items-center gap-2">
                                <Bot className="w-5 h-5 text-emerald-400" />
                                Follow-up Questions
                            </h2>

                            {/* Chat messages */}
                            {chatMessages.length > 0 && (
                                <div className="space-y-4 mb-6">
                                    {chatMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {msg.role === 'agent' && (
                                                <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                                                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                                    ? 'bg-zinc-800/50 text-zinc-200 border border-zinc-700/50'
                                                    : 'text-zinc-300'
                                                    }`}
                                            >
                                                {msg.role === 'agent' ? (
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            p: ({ children }) => <p className="text-zinc-300 leading-relaxed mb-2 last:mb-0">{children}</p>,
                                                            strong: ({ children }) => <strong className="text-zinc-200 font-semibold">{children}</strong>,
                                                            code: ({ children }) => <code className="bg-zinc-800 text-emerald-400 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                                            a: ({ href, children }) => (
                                                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline underline-offset-2">{children}</a>
                                                            ),
                                                            ul: ({ children }) => <ul className="list-disc list-inside text-zinc-300 mb-2 space-y-0.5">{children}</ul>,
                                                            ol: ({ children }) => <ol className="list-decimal list-inside text-zinc-300 mb-2 space-y-0.5">{children}</ol>,
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Loading indicator */}
                                    {chatLoading && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                                            </div>
                                            <div className="flex items-center gap-1.5 px-4 py-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Error message */}
                                    {chatError && (
                                        <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                            {chatError}
                                        </div>
                                    )}

                                    <div ref={chatEndRef} />
                                </div>
                            )}

                            {/* Chat input */}
                            <form onSubmit={handleChatSubmit}>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-xl opacity-50 blur group-hover:opacity-75 transition duration-200" />
                                    <div className="relative flex items-end bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm">
                                        <textarea
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleChatSubmit(e);
                                                }
                                            }}
                                            className="flex-1 bg-transparent border-0 text-zinc-200 placeholder-zinc-600 focus:ring-0 resize-none py-4 px-4 min-h-[56px] max-h-[120px] text-sm outline-none"
                                            placeholder="Ask a follow-up question about this report..."
                                            disabled={chatLoading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={chatLoading || !chatInput.trim()}
                                            className="m-2 p-2.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default CompletedView;
