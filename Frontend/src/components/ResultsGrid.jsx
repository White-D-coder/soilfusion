import React from 'react';
import {
    AreaChart, Area, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, CheckCircle2, TrendingUp, Sprout, Clock, BarChart2 } from 'lucide-react';

/* ── helpers ──────────────────────────────────────────────── */
const pct = (v) => (typeof v === 'number' ? v : parseFloat(v) || 0);

/* ── tiny metric card ─────────────────────────────────────── */
const MetricCard = ({ emoji, label, tip, value, unit, badge, badgeStyle }) => (
    <div className="card p-4 flex flex-col gap-2 animate-in">
        <div className="flex items-start justify-between">
            <div>
                <div className="text-xs font-bold text-stone-500 flex items-center gap-1">
                    <span>{emoji}</span>{label}
                </div>
                <div className="text-[11px] text-stone-400 leading-tight mt-0.5">{tip}</div>
            </div>
            {badge && <span className={`badge ${badgeStyle}`}>{badge}</span>}
        </div>
        <div className="text-2xl font-black text-stone-800 leading-none">
            {value ?? '—'}
            {unit && <span className="text-sm font-semibold text-stone-400 ml-1">{unit}</span>}
        </div>
    </div>
);

/* ── health status card ───────────────────────────────────── */
const HealthCard = ({ insight, t }) => {
    const bad = insight.anomaly_detected;
    return (
        <div className={`card p-5 animate-in flex items-start gap-4 ${bad ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className={`p-3 rounded-2xl flex-shrink-0 ${bad ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {bad ? <AlertTriangle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-1">{t('soil.title')}</div>
                <div className={`text-xl font-black ${bad ? 'text-red-700' : 'text-emerald-700'}`}>
                    {bad ? t('soil.critical') : t('soil.healthy')}
                </div>
                {insight.summary && (
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed line-clamp-3">{insight.summary}</p>
                )}
                {bad && insight.recovery_time && (
                    <div className={`flex items-center gap-1.5 mt-3 text-xs font-semibold text-red-600`}>
                        <Clock className="w-3.5 h-3.5" />
                        {t('results.recovery')}: {insight.recovery_time}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ── crop card ────────────────────────────────────────────── */
const CropCard = ({ rec, t }) => {
    const conf = pct(rec?.Confidence_Score);
    return (
        <div className="card p-5 animate-in-1">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600"><Sprout className="w-5 h-5" /></div>
                <div className="text-xs font-bold uppercase tracking-wide text-stone-400">{t('results.crop_title')}</div>
            </div>
            <div className="text-3xl font-black text-stone-800 mb-4">{rec?.Target_Crop ?? '—'}</div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-stone-500">
                    <span>{t('results.confidence')}</span>
                    <span className="text-amber-600 font-bold">{rec?.Confidence_Score ?? '—'}</span>
                </div>
                <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-700"
                        style={{ width: rec?.Confidence_Score ?? '0%' }}
                    />
                </div>
            </div>

            {rec?.Recommended_Start_Date && rec.Recommended_Start_Date !== 'N/A' && (
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-100 text-xs">
                    <span className="text-stone-400 font-medium">{t('results.start_date')}</span>
                    <span className="font-bold text-stone-700">{rec.Recommended_Start_Date}</span>
                </div>
            )}
        </div>
    );
};

/* ── yield card ──────────────────────────────────────────── */
const YieldCard = ({ value, t }) => (
    <div className="card p-5 animate-in-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600"><TrendingUp className="w-5 h-5" /></div>
            <div className="text-xs font-bold uppercase tracking-wide text-stone-400">{t('results.yield_title')}</div>
        </div>
        <div className="text-5xl font-black text-blue-700 leading-none">
            {value != null ? Math.round(value) : '—'}
        </div>
        <div className="text-sm font-semibold text-blue-400 mt-1">{t('results.yield_unit')}</div>
    </div>
);

/* ── custom tooltip ──────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-stone-200 shadow-lg rounded-xl px-3 py-2 text-xs">
            <div className="font-bold text-stone-600 mb-1">{label}</div>
            {payload.map((p) => (
                <div key={p.dataKey} className="flex items-center gap-1.5" style={{ color: p.color }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
                </div>
            ))}
        </div>
    );
};

/* ── charts ──────────────────────────────────────────────── */
const TrendCharts = ({ data, t }) => {
    if (!data?.length) return null;
    return (
        <div className="card p-5 animate-in-3">
            <div className="flex items-center gap-2 mb-5">
                <BarChart2 className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-stone-700">{t('results.trend_title')}</h3>
            </div>

            {/* Moisture area */}
            <div className="mb-6">
                <div className="text-xs font-semibold text-stone-400 mb-2">💧 {t('soil.moisture')} (%)</div>
                <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                            <defs>
                                <linearGradient id="mgrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip content={<ChartTip />} />
                            <Area type="monotone" dataKey="moisture" name="Moisture %" stroke="#3b82f6" strokeWidth={2.5} fill="url(#mgrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Nitrogen + Temp line */}
            <div>
                <div className="text-xs font-semibold text-stone-400 mb-2">🌿 {t('soil.nitrogen')} & 🌡️ {t('soil.temp')}</div>
                <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="n" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="t" orientation="right" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip content={<ChartTip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                            <Line yAxisId="n" type="monotone" dataKey="nitrogen" name="Nitrogen (ppm)" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                            <Line yAxisId="t" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

/* ── main export ─────────────────────────────────────────── */
const ResultsGrid = ({ insight }) => {
    const { t } = useLanguage();
    if (!insight) return null;

    const latest = insight.historical_data?.at?.(-1);

    const getMoistureBadge = (v) => {
        if (!v) return {};
        if (v < 20) return { badge: t('soil.critical'), badgeStyle: 'badge-red' };
        if (v < 40) return { badge: t('soil.needs_care'), badgeStyle: 'badge-amber' };
        return { badge: t('soil.healthy'), badgeStyle: 'badge-green' };
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-black text-stone-800">🌾 {t('results.title')}</h2>

            {/* Health + metrics */}
            <HealthCard insight={insight} t={t} />

            {/* Metric grid */}
            {latest && (
                <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                        emoji="💧" label={t('soil.moisture')} tip={t('soil.moisture_tip')}
                        value={latest.moisture?.toFixed(1)} unit="%"
                        {...getMoistureBadge(latest.moisture)}
                    />
                    <MetricCard
                        emoji="⚗️" label={t('soil.ph')} tip={t('soil.ph_tip')}
                        value={latest.ph?.toFixed(1) ?? '—'} unit=""
                        badge={latest.ph ? (latest.ph >= 6 && latest.ph <= 7.5 ? t('soil.healthy') : t('soil.needs_care')) : null}
                        badgeStyle={latest.ph >= 6 && latest.ph <= 7.5 ? 'badge-green' : 'badge-amber'}
                    />
                    <MetricCard
                        emoji="🌿" label={t('soil.nitrogen')} tip={t('soil.nitrogen_tip')}
                        value={latest.nitrogen?.toFixed(1)} unit=" ppm"
                        badge={latest.nitrogen < 50 ? t('soil.needs_care') : t('soil.healthy')}
                        badgeStyle={latest.nitrogen < 50 ? 'badge-amber' : 'badge-green'}
                    />
                    <MetricCard
                        emoji="🌡️" label={t('soil.temp')} tip={t('soil.temp_tip')}
                        value={latest.temperature?.toFixed(1)} unit="°C"
                    />
                </div>
            )}

            {/* Yield + Crop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <YieldCard value={insight.yield_prediction_kg_per_ha} t={t} />
                <CropCard rec={insight.recommendation} t={t} />
            </div>

            {/* Charts */}
            <TrendCharts data={insight.historical_data} t={t} />
        </div>
    );
};

export default ResultsGrid;
