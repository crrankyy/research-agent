import React, { useState } from 'react';
import { ArrowLeft, Lock, Key, Eye, EyeOff, Check, Shield } from 'lucide-react';
import { API_BASE } from '../api';

interface SettingsPageProps {
    onBack: () => void;
}

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
    // Password state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // API key state
    const [apiKey, setApiKey] = useState('');
    const [keyLoading, setKeyLoading] = useState(false);
    const [keyMessage, setKeyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwMessage(null);
        setPwLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/settings/password`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ old_password: oldPassword, new_password: newPassword, confirm_password: confirmPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update password');
            setPwMessage({ type: 'success', text: data.message });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPwMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
        } finally {
            setPwLoading(false);
        }
    };

    const handleApiKeyChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setKeyMessage(null);
        setKeyLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/settings/api-key`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ openrouter_api_key: apiKey }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update API key');
            setKeyMessage({ type: 'success', text: data.message });
            setApiKey('');
        } catch (err) {
            setKeyMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
        } finally {
            setKeyLoading(false);
        }
    };

    return (
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Back button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
                        <p className="text-sm text-zinc-500">Manage your account security and API access</p>
                    </div>
                </div>

                {/* Change Password */}
                <section className="mb-8">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-700/30 to-zinc-800/20 rounded-2xl opacity-50 blur-sm" />
                        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Lock className="w-4 h-4 text-zinc-400" />
                                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Change Password</h2>
                            </div>

                            {pwMessage && (
                                <div className={`mb-4 p-3 rounded-lg text-sm ${pwMessage.type === 'success'
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                    }`}>
                                    {pwMessage.type === 'success' && <Check className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
                                    {pwMessage.text}
                                </div>
                            )}

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Current Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type={showPasswords ? 'text' : 'password'}
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-10 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">New Password</label>
                                        <input
                                            type={showPasswords ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min 8 characters"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                                        <input
                                            type={showPasswords ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter password"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={pwLoading}
                                    className="px-5 py-2 bg-zinc-50 text-zinc-950 rounded-lg text-sm font-medium hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {pwLoading ? (
                                        <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-950 rounded-full animate-spin" />
                                    ) : (
                                        'Update Password'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Change API Key */}
                <section>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-700/30 to-zinc-800/20 rounded-2xl opacity-50 blur-sm" />
                        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Key className="w-4 h-4 text-zinc-400" />
                                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">OpenRouter API Key</h2>
                            </div>

                            {keyMessage && (
                                <div className={`mb-4 p-3 rounded-lg text-sm ${keyMessage.type === 'success'
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                    }`}>
                                    {keyMessage.type === 'success' && <Check className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
                                    {keyMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleApiKeyChange} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">New API Key</label>
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
                                    <p className="mt-1.5 text-[10px] text-zinc-600">Replace your current API key. The new key will be used for all future research queries.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={keyLoading}
                                    className="px-5 py-2 bg-zinc-50 text-zinc-950 rounded-lg text-sm font-medium hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {keyLoading ? (
                                        <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-950 rounded-full animate-spin" />
                                    ) : (
                                        'Update API Key'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default SettingsPage;
