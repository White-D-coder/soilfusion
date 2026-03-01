import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Leaf } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const LoginPage = () => {
    const { login, loading } = useAuth();
    const { t, lang, setLang, languages } = useLanguage();

    const demoLogin = async () => {
        try {
            const r = await fetch(`${API}/api/auth/demo`, { method: 'POST', credentials: 'include' });
            const data = await r.json();
            if (data.user) window.location.reload();
        } catch {
            alert('Demo login failed. Please ensure the backend is running.');
        }
    };

    return (
        <div style={styles.page}>
            {/* Language selector */}
            <div style={styles.langBar}>
                <select
                    value={lang}
                    onChange={e => setLang(e.target.value)}
                    style={styles.langSelect}
                    aria-label="Select Language"
                >
                    {languages.map(({ code, label }) => (
                        <option key={code} value={code}>{label}</option>
                    ))}
                </select>
            </div>

            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logoWrap}>
                    <div style={styles.logoIcon}><Leaf size={28} color="#fff" /></div>
                </div>
                <h1 style={styles.appName}>SoilFusion</h1>
                <p style={styles.tagline}>{t('tagline')}</p>

                <div style={styles.divider} />

                <p style={styles.welcome}>
                    {t('loginWelcome')}
                </p>

                {/* Google Sign-In */}
                <button
                    onClick={login}
                    disabled={loading}
                    style={styles.googleBtn}
                    id="google-login-btn"
                >
                    <svg width="20" height="20" viewBox="0 0 48 48" style={{ marginRight: 10 }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    {t('loginGoogle')}
                </button>

                {/* Demo access */}
                <button
                    onClick={demoLogin}
                    disabled={loading}
                    style={styles.demoBtn}
                    id="demo-login-btn"
                >
                    🌾 {t('loginDemo')}
                </button>

                <p style={styles.note}>{t('loginNote')}</p>
            </div>

            <p style={styles.footer}>SoilFusion · {t('loginFooter')}</p>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a3a2a 0%, #2d6a4f 50%, #52b788 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        padding: 20,
        position: 'relative',
    },
    langBar: { position: 'absolute', top: 20, right: 20 },
    langSelect: {
        background: 'rgba(255,255,255,0.15)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 8,
        padding: '6px 12px',
        fontSize: 13,
        cursor: 'pointer',
        outline: 'none',
    },
    card: {
        background: '#fff',
        borderRadius: 24,
        padding: '40px 36px',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    },
    logoWrap: {
        width: 64, height: 64,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
        boxShadow: '0 8px 20px rgba(45,106,79,0.4)',
    },
    logoIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    appName: { fontSize: 28, fontWeight: 900, color: '#1a3a2a', margin: '0 0 4px' },
    tagline: { fontSize: 14, color: '#6B7280', margin: '0 0 24px' },
    divider: { height: 1, background: '#F3F4F6', margin: '0 0 24px' },
    welcome: { fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 28 },
    googleBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '14px 20px',
        background: '#fff',
        border: '2px solid #E5E7EB',
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 700,
        color: '#374151',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: 12,
    },
    demoBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '13px 20px',
        background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
        border: 'none',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 700,
        color: '#fff',
        cursor: 'pointer',
        marginBottom: 20,
        letterSpacing: 0.3,
        boxShadow: '0 4px 14px rgba(45,106,79,0.35)',
    },
    note: { fontSize: 12, color: '#9CA3AF', lineHeight: 1.5, margin: 0 },
    footer: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 24 },
};

export default LoginPage;
