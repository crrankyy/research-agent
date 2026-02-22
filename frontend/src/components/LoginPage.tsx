import React, { useState } from 'react';
import { Bot, User, Lock, Key, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type AuthTab = 'login' | 'signup';

const LoginPage: React.FC = () => {
    const { login, signup } = useAuth();
    const [tab, setTab] = useState<AuthTab>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(false);

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setApiKey('');
        setError(null);
        setSignupSuccess(false);
    };

    const handleTabSwitch = (newTab: AuthTab) => {
        setTab(newTab);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (tab === 'login') {
                await login(username, password);
            } else {
                await signup(username, password, confirmPassword, apiKey);
                setSignupSuccess(true);
                setTimeout(() => {
                    handleTabSwitch('login');
                }, 1500);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-zinc-950 text-zinc-100 font-sans antialiased h-screen flex items-center justify-center overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
            {/* Background grid */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.04),transparent_70%)]" />
            <div className="absolute inset-0 opacity-[0.015]" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
            }} />

            <div className="relative w-full max-w-md mx-4">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-white/5">
                        <Bot className="text-zinc-950 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Research<span className="opacity-40 font-normal">Agent</span>
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">AI-powered research assistant</p>
                </div>

                {/* Card */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-zinc-700/30 to-emerald-500/20 rounded-2xl opacity-50 blur-sm" />
                    <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl shadow-black/40">
                        {/* Tabs */}
                        <div className="flex gap-1 bg-zinc-950 rounded-lg p-1 mb-6">
                            <button
                                onClick={() => handleTabSwitch('login')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${tab === 'login'
                                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => handleTabSwitch('signup')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${tab === 'signup'
                                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                Create Account
                            </button>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Success message */}
                        {signupSuccess && (
                            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Account created! Redirecting to login...
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter username"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={tab === 'signup' ? 'Minimum 8 characters' : 'Enter password'}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-10 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Signup-only fields */}
                            {tab === 'signup' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Re-enter password"
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">OpenRouter API Key</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <input
                                                type="password"
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder="sk-or-v1-..."
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono text-xs"
                                                required
                                            />
                                        </div>
                                        <p className="mt-1 text-[10px] text-zinc-600">Your key is stored securely and used for your research queries only.</p>
                                    </div>
                                </>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-zinc-50 text-zinc-950 py-2.5 rounded-lg text-sm font-medium
                  hover:bg-white transition-all duration-200 flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-950 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {tab === 'login' ? 'Sign In' : 'Create Account'}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-zinc-600 mt-6">
                    Powered by OpenRouter • End-to-end encrypted
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
