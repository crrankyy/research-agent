import React, { useState, useRef, useEffect } from 'react';
import { Bot, Clock, CheckCircle, LogOut, Menu } from 'lucide-react';
import type { AppState } from '../types';

interface HeaderProps {
    appState: AppState;
    elapsedTime: string;
    username?: string;
    onLogout?: () => void;
    onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ appState, elapsedTime, username, onLogout, onToggleSidebar }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    return (
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-3 md:px-4 bg-zinc-950 shrink-0 z-30">
            {/* Left: Hamburger (mobile) + Logo + status badge */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Hamburger — mobile only */}
                <button
                    onClick={onToggleSidebar}
                    className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors md:hidden"
                    title="Menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center">
                    <Bot className="text-zinc-950 w-5 h-5" />
                </div>
                <span className="font-semibold text-sm tracking-tight text-zinc-50">
                    Research<span className="opacity-50 font-normal">Agent</span>
                </span>

                {/* State-dependent badge — hidden on mobile for space */}
                {appState === 'idle' && (
                    <div className="hidden sm:flex items-center gap-2 ml-4 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        System Operational
                    </div>
                )}
                {(appState === 'processing' || appState === 'synthesizing') && (
                    <>
                        <div className="h-6 w-[1px] bg-zinc-800 mx-1 md:mx-2" />
                        <span className="px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            {appState === 'processing' ? 'Processing' : 'Synthesizing'}
                        </span>
                    </>
                )}
                {appState === 'completed' && (
                    <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wide">
                            Research Completed
                        </span>
                    </div>
                )}
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-3 md:gap-4">
                {(appState === 'processing' || appState === 'synthesizing') && (
                    <>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Clock className="w-4 h-4" />
                            <span className="font-mono">{elapsedTime}</span>
                        </div>
                        <div className="h-4 w-[1px] bg-zinc-800" />
                    </>
                )}

                {/* Avatar with dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer"
                        title={username || 'Account'}
                    />

                    {menuOpen && (
                        <div className="absolute right-0 top-10 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                            {/* User info */}
                            <div className="p-4 flex items-center gap-3 border-b border-zinc-800">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-zinc-100 truncate">{username || 'User'}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Researcher</p>
                                </div>
                            </div>

                            {/* Logout */}
                            {onLogout && (
                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onLogout();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
