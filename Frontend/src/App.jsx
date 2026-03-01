import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import HistoryPanel from './components/HistoryPanel';


const API = 'http://localhost:5001';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const cls = (...a) => a.filter(Boolean).join(' ');

const Chip = ({ children, color = 'amber' }) => {
  const map = {
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={cls('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold', map[color])}>
      {children}
    </span>
  );
};

const Card = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={cls(
      'bg-white rounded-2xl border border-gray-100 shadow-sm',
      onClick && 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]',
      className
    )}
  >
    {children}
  </div>
);

const Btn = ({ children, onClick, disabled, variant = 'primary', className = '' }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl px-4 transition active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none min-h-[48px] text-sm';
  const v = {
    primary: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200',
    ghost: 'border-2 border-amber-400 text-amber-600 hover:bg-amber-50',
    white: 'bg-white text-amber-700 hover:bg-amber-50',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={cls(base, v[variant], className)}>
      {children}
    </button>
  );
};

const Spinner = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Alert = ({ msg, type = 'warn', onClose }) => {
  const s = {
    warn: 'bg-amber-50 border-amber-400 text-amber-800',
    error: 'bg-red-50 border-red-400 text-red-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800',
  };
  return (
    <div className={cls('flex items-start gap-2 px-4 py-3 border-l-4 text-sm', s[type])}>
      <span className="flex-1 leading-snug">{msg}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-50 hover:opacity-100 text-lg leading-none flex-shrink-0 ml-2">×</button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Weather (free Open-Meteo + Nominatim)
// ─────────────────────────────────────────────
const useWeather = () => {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState('');
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async ({ coords: { latitude: lat, longitude: lon } }) => {
      try {
        const [geo, wx] = await Promise.allSettled([
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`).then(r => r.json()),
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature&timezone=auto`).then(r => r.json()),
        ]);
        if (geo.status === 'fulfilled') {
          const a = geo.value.address;
          setCity(a.city || a.town || a.village || a.county || '');
        }
        if (wx.status === 'fulfilled') {
          const d = wx.value;
          setWeather({
            temp: Math.round(d.current_weather.temperature),
            wind: Math.round(d.current_weather.windspeed),
            humidity: d.hourly.relativehumidity_2m[0],
            feels: Math.round(d.hourly.apparent_temperature[0]),
            code: d.current_weather.weathercode,
          });
        }
      } catch { }
    }, () => { }, { timeout: 8000 });
  }, []);
  return { weather, city };
};

const wIcon = (c) => c === 0 ? '☀️' : c <= 2 ? '⛅' : c <= 48 ? '🌫️' : '🌧️';

// ─────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────
const Header = () => {
  const { lang, setLang, t, languages } = useLanguage();
  const { user, logout } = useAuth();
  const { weather, city } = useWeather();

  return (
    <header className="sticky top-0 z-50 shrink-0">
      {/* Top row */}
      <div className="w-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 sm:px-5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white text-amber-600 font-black text-xs flex items-center justify-center shadow flex-shrink-0">
              SF
            </div>
            <div className="min-w-0">
              <div className="text-white font-black text-sm sm:text-base leading-tight truncate">{t('appName')}</div>
              <div className="text-amber-100 text-[10px] leading-none hidden sm:block">{t('tagline')}</div>
            </div>
          </div>
          {/* Right: lang dropdown + user avatar */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="flex bg-white/20 rounded-lg p-0.5">
              <select
                value={lang}
                onChange={e => setLang(e.target.value)}
                className="bg-transparent text-white text-xs font-bold px-2 py-1 rounded-md cursor-pointer outline-none"
                aria-label="Select Language"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                {(languages || []).map(({ code, label }) => (
                  <option key={code} value={code} style={{ color: '#000', background: '#fff' }}>{label}</option>
                ))}
              </select>
            </div>
            {/* User avatar + logout */}
            {user && (
              <div className="flex items-center gap-1.5">
                {user.picture
                  ? <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full border-2 border-white/50" />
                  : <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold">{user.name?.[0]}</div>
                }
                <button onClick={logout} className="text-white/70 text-xs hover:text-white" title="Logout">✕</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weather strip — horizontal scroll on small screens */}
      <div className="w-full bg-amber-600 border-b border-amber-700/30 px-3 sm:px-5 py-1.5 overflow-hidden">
        <div className="flex items-center gap-3 text-[11px] text-amber-50 overflow-x-auto no-scrollbar whitespace-nowrap">
          {city && <span className="flex-shrink-0">📍 {city}</span>}
          {weather ? (
            <>
              <span className="flex-shrink-0 font-bold text-white">{wIcon(weather.code)} {weather.temp}°C</span>
              <span className="flex-shrink-0">{t('wFeels')} {weather.feels}°C</span>
              <span className="flex-shrink-0">{t('wHumid')} {weather.humidity}%</span>
              <span className="flex-shrink-0">{t('wWind')} {weather.wind} km/h</span>
            </>
          ) : (
            <span className="opacity-60">{t('wLoading')}</span>
          )}
        </div>
      </div>
    </header>
  );
};

// ─────────────────────────────────────────────
// Upload widget
// ─────────────────────────────────────────────
const Upload = ({ onSuccess }) => {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState('idle');
  const inputRef = useRef();

  const reset = (e) => { e?.preventDefault(); e?.stopPropagation(); setFile(null); setPhase('idle'); };

  const go = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      setPhase('uploading');
      await axios.post(`${API}/api/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPhase('processing');
      await axios.post(`${API}/api/ml/run-pipeline`);
      setPhase('done');
      onSuccess?.();
    } catch {
      setPhase('error');
    }
  };

  const busy = phase === 'uploading' || phase === 'processing';
  const msg = { uploading: t('upUploading'), processing: t('upProcessing'), done: t('upDone'), error: t('upFail') }[phase];

  return (
    <section id="sf-upload">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">{t('upTitle')}</p>
      <Card className="overflow-hidden">
        {/* Drop zone */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2.5 p-7 text-center hover:bg-amber-50 transition focus-visible:bg-amber-50"
          aria-label={t('upChoose')}
        >
          <div className="text-4xl">{file ? '📄' : '📁'}</div>
          {file ? (
            <div className="flex items-center gap-1.5 text-gray-700 text-sm font-semibold max-w-[240px]">
              <span className="truncate">{file.name}</span>
              <span onClick={reset} className="text-gray-400 hover:text-red-500 flex-shrink-0 text-lg leading-none">×</span>
            </div>
          ) : (
            <>
              <span className="text-sm font-bold text-amber-600">{t('upChoose')}</span>
              <span className="text-xs text-gray-400">{t('upDesc')}</span>
            </>
          )}
        </button>
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.json" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setPhase('idle'); } }} aria-label={t('upTitle')} />

        {/* CTA */}
        <div className="px-4 pb-4">
          <Btn onClick={go} disabled={!file || busy} className="w-full">
            {busy ? <><Spinner /> {msg}</> : t('upBtn')}
          </Btn>
        </div>

        {/* Status */}
        {msg && !busy && (
          <div aria-live="polite" className={cls('mx-4 mb-4 px-4 py-2.5 rounded-xl text-sm font-semibold text-center border',
            phase === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          )}>
            {msg}
          </div>
        )}
      </Card>
    </section>
  );
};

// ─────────────────────────────────────────────
// Field analyzer form
// ─────────────────────────────────────────────
const FieldForm = ({ fieldId, setFieldId, fields, onAnalyze, loading }) => {
  const { t, lang } = useLanguage();
  return (
    <section id="sf-analyze">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">{t('fiTitle')}</p>
      <Card className="p-4">
        <label className="block text-xs font-bold text-gray-500 mb-1" htmlFor="sf-fid">
          {t('fiLabel')} <span className="font-normal text-gray-400">— {t('fiHint')}</span>
        </label>

        {fields.length > 0 ? (
          <select
            id="sf-fid"
            value={fieldId}
            onChange={e => setFieldId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 text-gray-800 font-bold text-base mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            aria-label={t('fiLabel')}
          >
            {fields.map(f => (
              <option key={f.id} value={f.id}>
                {f.name !== f.id ? `${f.name} (Field ${f.id})` : `Field ${f.id}`}
              </option>
            ))}
          </select>
        ) : (
          <select
            disabled
            className="w-full border border-gray-200 rounded-xl px-3 py-3 bg-gray-100 text-gray-400 font-bold text-base mb-3 focus:outline-none"
            aria-label={t('fiLabel')}
          >
            <option>⏳ {lang === 'hi' ? 'Kripya pehle CSV data upload karein' : 'Please upload CSV data first'}</option>
          </select>
        )}

        <Btn onClick={() => onAnalyze(fieldId)} disabled={!fieldId || loading} className="w-full">
          {loading ? <><Spinner /> {t('fiLoading')}</> : t('fiBtn')}
        </Btn>
      </Card>
    </section>
  );
};

// ─────────────────────────────────────────────
// Metric tile (simple term explainer)
// ─────────────────────────────────────────────
const MetricTile = ({ icon, label, tip, value, unit, chipLabel, chipColor }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex flex-col gap-2">
    <div className="flex items-start justify-between gap-1">
      <div>
        <div className="text-xs font-bold text-gray-500 flex items-center gap-1">{icon} {label}</div>
        <div className="text-[11px] text-gray-400 leading-tight mt-0.5">{tip}</div>
      </div>
      {chipLabel && <Chip color={chipColor}>{chipLabel}</Chip>}
    </div>
    <div className="text-2xl font-black text-gray-800 tabular-nums">
      {value ?? '—'}
      {unit && <span className="text-sm font-semibold text-gray-400 ml-1">{unit}</span>}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Custom chart tooltip
// ─────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <div className="font-bold text-gray-500 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-1.5 font-semibold" style={{ color: p.color }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// Results panel
// ─────────────────────────────────────────────
const Results = ({ insight }) => {
  const { t } = useLanguage();
  if (!insight) return null;

  const bad = !!insight.anomaly_detected;
  const hist = insight.historical_data ?? [];
  const latest = hist.at(-1);
  const rec = insight.recommendation ?? {};

  const pct = (s) => parseFloat(s) || 0;

  const getMoistureBadge = (v) => {
    if (!v) return ['—', 'gray'];
    if (v < 20) return [t('low'), 'red'];
    if (v < 40) return [t('ok'), 'amber'];
    return [t('healthy'), 'green'];
  };
  const [mBadge, mColor] = getMoistureBadge(latest?.moisture);

  const getPhBadge = (v) => {
    if (!v) return ['—', 'gray'];
    if (v < 6 || v > 7.5) return [t('low'), 'amber'];
    return [t('healthy'), 'green'];
  };
  const [pBadge, pColor] = getPhBadge(latest?.ph);

  return (
    <div className="space-y-4 fade-up">
      {/* Header */}
      <h2 className="text-base font-black text-gray-700 px-1">🌾 {t('resTitle')}</h2>

      {/* Soil health card */}
      <Card className={cls('p-4 fade-up', bad ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100')}>
        <div className="flex items-start gap-3">
          <div className={cls('text-3xl w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', bad ? 'bg-red-100' : 'bg-emerald-100')}>
            {bad ? '⚠️' : '✅'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">{t('resSoil')}</div>
            <div className={cls('text-xl font-black mt-0.5', bad ? 'text-red-700' : 'text-emerald-700')}>
              {bad ? t('resBad') : t('resGood')}
            </div>
            {insight.summary && (
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{insight.summary}</p>
            )}
            {bad && insight.recovery_time && (
              <div className="flex items-center gap-1 text-xs text-red-600 font-semibold mt-2">
                ⏱ {t('resRecovery')}: {insight.recovery_time}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Soil metrics — 2 cols always */}
      {latest && (
        <div className="grid grid-cols-2 gap-2.5 fade-up-1">
          <MetricTile icon="💧" label={t('moisture')} tip="Best: 30–60%" value={latest.moisture?.toFixed(1)} unit="%" chipLabel={mBadge} chipColor={mColor} />
          <MetricTile icon="⚗️" label={t('ph')} tip="Best: 6–7.5" value={latest.ph?.toFixed(1)} unit="" chipLabel={pBadge} chipColor={pColor} />
          <MetricTile icon="🌿" label={t('nitrogen')} tip="Best: >50 ppm" value={latest.nitrogen?.toFixed(1)} unit=" ppm"
            chipLabel={latest.nitrogen < 50 ? t('low') : t('healthy')}
            chipColor={latest.nitrogen < 50 ? 'amber' : 'green'}
          />
          <MetricTile icon="🌡️" label={t('soilTemp')} tip="Best: 15–30°C" value={latest.temperature?.toFixed(1)} unit="°C" />
        </div>
      )}

      {/* Yield + Crop side by side on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 fade-up-2">
        {/* Yield */}
        <Card className="p-4 bg-blue-50 border-blue-100">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-400 mb-2">{t('resYield')}</div>
          <div className="text-4xl font-black text-blue-700 tabular-nums">
            {insight.yield_prediction_kg_per_ha != null ? Math.round(insight.yield_prediction_kg_per_ha) : '—'}
          </div>
          <div className="text-xs text-blue-400 font-semibold mt-1">{t('resYieldUnit')}</div>
        </Card>

        {/* Crop */}
        <Card className="p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{t('resCrop')}</div>
          <div className="text-2xl font-black text-gray-800 flex items-center gap-2">
            🌾 {rec.Target_Crop ?? '—'}
          </div>
          {rec.Confidence_Score && (
            <div className="mt-3">
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                <span>{t('resConf')}</span>
                <span className="text-amber-600 font-bold">{rec.Confidence_Score}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-700"
                  style={{ width: rec.Confidence_Score }}
                />
              </div>
            </div>
          )}
          {rec.Recommended_Start_Date && rec.Recommended_Start_Date !== 'N/A' && (
            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-gray-100 text-xs">
              <span className="text-gray-400 font-medium">{t('resSow')}</span>
              <span className="font-bold text-gray-700">{rec.Recommended_Start_Date}</span>
            </div>
          )}
        </Card>
      </div>

      {/* Charts */}
      {hist.length > 0 && (
        <Card className="p-4 fade-up-3">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">📊 {t('resTrend')}</div>

          {/* Moisture area */}
          <div className="mb-4">
            <div className="text-[11px] text-gray-400 mb-2">💧 Water in soil (%)</div>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hist} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="date" stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="moisture" name="Moisture %" stroke="#3b82f6" strokeWidth={2.5} fill="url(#mg)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* N + Temp lines */}
          <div>
            <div className="text-[11px] text-gray-400 mb-2">🌿 Nitrogen (ppm) &amp; 🌡️ Temp (°C)</div>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hist} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="date" stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="n" stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="t" orientation="right" stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line yAxisId="n" type="monotone" dataKey="nitrogen" name="Nitrogen" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  <Line yAxisId="t" type="monotone" dataKey="temperature" name="Temp" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
const Skel = () => (
  <div className="space-y-3">
    <div className="shimmer h-24 w-full" />
    <div className="grid grid-cols-2 gap-2.5">
      {[1, 2, 3, 4].map(i => <div key={i} className="shimmer h-20 w-full" />)}
    </div>
    <div className="grid grid-cols-2 gap-2.5">
      <div className="shimmer h-28 w-full" />
      <div className="shimmer h-28 w-full" />
    </div>
    <div className="shimmer h-72 w-full" />
  </div>
);

// ─────────────────────────────────────────────
// No-data
// ─────────────────────────────────────────────
const NoData = () => {
  const { t } = useLanguage();
  return (
    <div className="text-center py-14 px-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="text-5xl mb-3">🌾</div>
      <p className="text-gray-400 text-sm max-w-[240px] mx-auto">{t('resNoData')}</p>
    </div>
  );
};

// ─────────────────────────────────────────────
// Bottom nav
// ─────────────────────────────────────────────
const BottomNav = () => {
  const { t } = useLanguage();
  const items = [
    { emoji: '🏠', label: t('navHome'), scroll: null },
    { emoji: '📊', label: t('navReport'), scroll: 'sf-analyze' },
    { emoji: '📤', label: t('navUpload'), scroll: 'sf-upload' },
    { emoji: '⚙️', label: t('navMore'), scroll: null },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-b">
      <div className="flex justify-around items-center w-full max-w-2xl mx-auto py-1.5 px-2">
        {items.map(({ emoji, label, scroll }) => (
          <button
            key={label}
            onClick={() => {
              if (scroll) document.getElementById(scroll)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              else window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-gray-500 hover:text-amber-600 active:bg-amber-50 transition flex-1"
          >
            <span className="text-xl leading-none">{emoji}</span>
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// ─────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────
function Inner() {
  const { t, lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [fields, setFields] = useState([]);
  const [fieldId, setFieldId] = useState('');
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Show login page if not authenticated
  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8' }}>
      <div style={{ fontSize: 32 }}>🌱</div>
    </div>
  );
  if (!user) return <LoginPage />;

  const loadFields = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/ml/fields`);
      const f = r.data.fields ?? [];
      setFields(f);
      return f[0] ? String(f[0].id) : '';
    } catch { return ''; }
  }, []);

  useEffect(() => { loadFields().then(id => { if (id) setFieldId(id); }); }, [loadFields]);

  const analyze = useCallback(async (id = fieldId) => {
    if (!id) return;
    setLoading(true); setInsight(null); setAlerts([]);
    try {
      const r = await axios.post(`${API}/api/ml/predict`, { field_id: parseInt(id), lang });
      const data = r.data;
      setInsight(data);
      const al = [];
      if (data.anomaly_detected) al.push({ msg: t('alertAnomaly'), type: 'error' });
      const l = data.historical_data?.at?.(-1);
      if (l?.moisture < 20) al.push({ msg: t('alertDry'), type: 'warn' });
      if (l?.nitrogen < 50) al.push({ msg: t('alertN'), type: 'warn' });
      setAlerts(al);
    } catch {
      alert(t('fiError'));
    }
    setLoading(false);
  }, [fieldId, lang, t]);

  const handleUploadDone = useCallback(async () => {
    const id = await loadFields();
    if (id) { setFieldId(id); analyze(id); }
  }, [loadFields, analyze]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#f4f6f8]">
      <Header />

      {/* Alert banners — full width */}
      <div className="w-full">
        {alerts.map((a, i) => (
          <Alert key={i} msg={a.msg} type={a.type} onClose={() => setAlerts(p => p.filter((_, j) => j !== i))} />
        ))}
      </div>

      {/* Main — mobile: 1 col, lg+: 2 col */}
      <main className="flex-1 w-full px-3 sm:px-4 py-4 pb-28 space-y-4
                       max-w-screen-lg mx-auto">

        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 sm:p-7 text-white fade-up">
          <div className="absolute right-3 bottom-2 text-7xl opacity-20 pointer-events-none select-none leading-none">🌾</div>
          <h1 className="text-xl sm:text-2xl font-black leading-snug mb-1">{t('greeting')}</h1>
          <p className="text-amber-100 text-sm mb-5">{t('heroSub')}</p>
          <div className="flex flex-col xs:flex-row gap-2">
            <Btn variant="white" className="flex-1" onClick={() => document.getElementById('sf-analyze')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
              {t('fiBtn')}
            </Btn>
            <Btn variant="ghost" className="flex-1 border-white/50 text-white hover:bg-white/20" onClick={() => document.getElementById('sf-upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
              {t('upTitle')}
            </Btn>
          </div>
        </div>

        {/* Two-column on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">

          {/* Left: forms */}
          <div className="space-y-4">
            <HistoryPanel />
            <Upload onSuccess={handleUploadDone} />
            <FieldForm fieldId={fieldId} setFieldId={setFieldId} fields={fields} onAnalyze={analyze} loading={loading} />
          </div>

          {/* Right: results */}
          <div>
            {loading ? <Skel /> : insight ? <Results insight={insight} /> : <NoData />}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Inner />
      </LanguageProvider>
    </AuthProvider>
  );
}
