import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_BASE } from '../api';

interface AuthUser {
    id: string;
    username: string;
}

interface AuthContextType {
    token: string | null;
    user: AuthUser | null;
    login: (username: string, password: string) => Promise<void>;
    signup: (username: string, password: string, confirmPassword: string, apiKey: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
    const [user, setUser] = useState<AuthUser | null>(() => {
        const stored = localStorage.getItem('auth_user');
        return stored ? JSON.parse(stored) : null;
    });

    // Persist to localStorage
    useEffect(() => {
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }, [token]);

    useEffect(() => {
        if (user) {
            localStorage.setItem('auth_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('auth_user');
        }
    }, [user]);

    const login = useCallback(async (username: string, password: string) => {
        const res = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        setToken(data.access_token);
        setUser(data.user);
    }, []);

    const signup = useCallback(async (
        username: string,
        password: string,
        confirmPassword: string,
        apiKey: string
    ) => {
        const res = await fetch(`${API_BASE}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                confirm_password: confirmPassword,
                openrouter_api_key: apiKey,
            }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ token, user, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
