import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthCtx = createContext(null);
const API = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/+$/, '');

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(undefined); // undefined = loading
    const [loading, setLoading] = useState(true);

    // Fetch current session on mount
    useEffect(() => {
        fetch(`${API}/api/auth/me`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                setUser(data.user || null);
                setLoading(false);
            })
            .catch(() => {
                setUser(null);
                setLoading(false);
            });
    }, []);

    // Redirect to Google OAuth flow
    const login = useCallback(() => {
        window.location.href = `${API}/api/auth/google`;
    }, []);

    // Logout and clear state
    const logout = useCallback(async () => {
        await fetch(`${API}/api/auth/logout`, { credentials: 'include' });
        setUser(null);
    }, []);

    return (
        <AuthCtx.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthCtx.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
