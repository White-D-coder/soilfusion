import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

import Header from './Header';
import UploadWidget from './UploadWidget';
import FieldAnalyzer from './FieldAnalyzer';
import ResultsGrid from './ResultsGrid';
import AlertBanner from './AlertBanner';
import { Home, BarChart2, UploadCloud, Settings } from 'lucide-react';

/* ─── Hero card ──────────────────────────────────────────────────── */
const Hero = ({ t }) => (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 sm:p-7 text-white shadow-md animate-in">
        <div className="absolute -right-4 -bottom-4 text-7xl sm:text-8xl opacity-20 pointer-events-none select-none leading-none">🌾</div>
        <div className="relative z-10">
            <h1 className="text-xl sm:text-3xl font-black leading-tight mb-1">{t('hero.greeting')}</h1>
            <p className="text-amber-100 text-sm mb-5">{t('hero.subtitle')}</p>
            <div className="flex flex-col xs:flex-row gap-2">
                <button
                    onClick={() => document.getElementById('analyze-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    className="flex-1 bg-white text-amber-700 font-bold py-3 rounded-xl text-sm hover:bg-amber-50 active:scale-[0.97] transition shadow flex items-center justify-center gap-2 min-h-[46px]"
                >
                    {t('hero.check_btn')}
                </button>
                <button
                    onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    className="flex-1 bg-amber-700/40 text-white font-bold py-3 rounded-xl text-sm hover:bg-amber-700/60 active:scale-[0.97] transition border border-white/20 flex items-center justify-center gap-2 min-h-[46px]"
                >
                    {t('hero.upload_btn')}
                </button>
            </div>
        </div>
    </div>
);

/* ─── Skeleton ───────────────────────────────────────────────────── */
const Skeleton = () => (
    <div className="space-y-4 animate-in">
        <div className="skeleton h-28 rounded-2xl w-full" />
        <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="skeleton h-44 rounded-2xl w-full" />
        <div className="skeleton h-56 rounded-2xl w-full" />
    </div>
);

/* ─── No-data ────────────────────────────────────────────────────── */
const NoData = ({ t }) => (
    <div className="card flex flex-col items-center py-12 px-6 text-center animate-in">
        <div className="text-5xl mb-3">🌾</div>
        <p className="text-stone-400 text-sm max-w-[260px]">{t('results.no_data')}</p>
    </div>
);

/* ─── Bottom Nav ─────────────────────────────────────────────────── */
const BottomNav = ({ t, onUpload, onAnalyze }) => {
    const items = [
        { icon: <Home className="w-5 h-5" />, label: t('nav.home'), onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
        { icon: <BarChart2 className="w-5 h-5" />, label: t('nav.insights'), onClick: onAnalyze },
        { icon: <UploadCloud className="w-5 h-5" />, label: t('nav.upload'), onClick: onUpload },
        { icon: <Settings className="w-5 h-5" />, label: t('nav.settings'), onClick: null },
    ];
    return (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200">
            <div className="grid grid-cols-4 w-full max-w-2xl mx-auto">
                {items.map(({ icon, label, onClick }) => (
                    <button
                        key={label}
                        onClick={onClick}
                        className="flex flex-col items-center justify-center gap-1 py-2 px-1 text-stone-500 hover:text-amber-600 active:bg-amber-50 transition"
                    >
                        {icon}
                        <span className="text-[10px] sm:text-xs font-semibold truncate w-full text-center">{label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

/* ─── Dashboard ──────────────────────────────────────────────────── */
const API = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/+$/, '');

const Dashboard = () => {
    const { t, lang } = useLanguage();
    const [fields, setFields] = useState([]);
    const [fieldId, setFieldId] = useState('');
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alerts, setAlerts] = useState([]);

    const loadFields = useCallback(async () => {
        try {
            const r = await axios.get(`${API}/api/ml/fields`);
            const f = r.data.fields ?? [];
            setFields(f);
            return f[0] ? String(f[0]) : '';
        } catch { return ''; }
    }, []);

    useEffect(() => {
        loadFields().then(id => { if (id) setFieldId(id); });
    }, [loadFields]);

    const makeAlerts = useCallback((data) => {
        const a = [];
        if (data.anomaly_detected) a.push({ msg: t('alerts.anomaly'), type: 'error' });
        const l = data.historical_data?.at?.(-1);
        if (l?.moisture < 20) a.push({ msg: t('alerts.low_moisture'), type: 'warning' });
        if (l?.nitrogen < 50) a.push({ msg: t('alerts.low_nitrogen'), type: 'warning' });
        return a;
    }, [t]);

    const analyze = useCallback(async (id = fieldId) => {
        if (!id) return;
        setLoading(true); setInsight(null); setAlerts([]);
        try {
            const r = await axios.post(`${API}/api/ml/predict`, { field_id: parseInt(id), lang });
            setInsight(r.data);
            setAlerts(makeAlerts(r.data));
        } catch { alert(t('analyze.error')); }
        finally { setLoading(false); }
    }, [fieldId, lang, t, makeAlerts]);

    const handleUploadSuccess = useCallback(async () => {
        const id = await loadFields();
        if (id) { setFieldId(id); analyze(id); }
    }, [loadFields, analyze]);

    const scrollToUpload = () => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const scrollToAnalyze = () => document.getElementById('analyze-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    return (
        <div className="min-h-screen w-full bg-[#f8f9fb] flex flex-col">
            <Header />

            {/* Alerts ── full width under header */}
            <div className="w-full">
                {alerts.map((a, i) => <AlertBanner key={i} message={a.msg} type={a.type} />)}
            </div>

            {/* Main content — responsive max-width */}
            <main className="flex-1 w-full mx-auto px-3 sm:px-4 py-4 space-y-4 pb-28
                       max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-5xl">

                {/* Desktop: 2 column, Mobile: single column */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">

                    {/* Left / main column */}
                    <div className="space-y-4 min-w-0">
                        <Hero t={t} />
                        <UploadWidget onSuccess={handleUploadSuccess} />
                        <FieldAnalyzer
                            fieldId={fieldId}
                            setFieldId={setFieldId}
                            fields={fields}
                            onAnalyze={analyze}
                            loading={loading}
                        />
                    </div>

                    {/* Right / results column (on desktop sits alongside, mobile stacks below) */}
                    <div className="min-w-0">
                        {loading ? <Skeleton /> : insight ? <ResultsGrid insight={insight} /> : <NoData t={t} />}
                    </div>
                </div>
            </main>

            <BottomNav t={t} onUpload={scrollToUpload} onAnalyze={scrollToAnalyze} />
        </div>
    );
};

export default Dashboard;
