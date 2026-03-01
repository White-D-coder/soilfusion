import React, { useState, useEffect } from 'react';
import { MapPin, Thermometer, Wind, Droplets, Bell } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const getWeather = async (lat, lon) => {
    const r = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature&timezone=auto`
    );
    const d = await r.json();
    return {
        temp: Math.round(d.current_weather.temperature),
        wind: Math.round(d.current_weather.windspeed),
        humidity: d.hourly.relativehumidity_2m[0],
        feels: Math.round(d.hourly.apparent_temperature[0]),
        code: d.current_weather.weathercode,
    };
};

const weatherEmoji = (code) => {
    if (code === 0) return '☀️';
    if (code <= 2) return '⛅';
    if (code <= 49) return '🌫️';
    return '🌧️';
};

const getLoc = async (lat, lon) => {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    const d = await r.json();
    return d.address?.city || d.address?.town || d.address?.village || '';
};

const Header = () => {
    const { lang, setLang, t, languages } = useLanguage();
    const [w, setW] = useState(null);
    const [loc, setLoc] = useState('');

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            async ({ coords: { latitude, longitude } }) => {
                try { setLoc(await getLoc(latitude, longitude)); } catch { }
                try { setW(await getWeather(latitude, longitude)); } catch { }
            },
            () => { },
            { timeout: 8000 }
        );
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full">
            {/* ── Main bar ── */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 w-full">
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 w-full">

                    {/* Logo + title */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-amber-600 font-black text-xs sm:text-sm shadow flex-shrink-0">
                            SF
                        </div>
                        <div className="min-w-0">
                            <div className="text-white font-black text-sm sm:text-base leading-tight truncate">{t('app.subtitle')}</div>
                            <div className="text-amber-100 text-[10px] sm:text-xs leading-none hidden xs:block">{t('app.tagline')}</div>
                        </div>
                    </div>

                    {/* Right: lang toggle + bell */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="flex bg-white/20 rounded-lg p-0.5">
                            <select
                                value={lang}
                                onChange={(e) => setLang(e.target.value)}
                                className="bg-transparent text-white text-xs font-bold px-2 py-1 rounded-md cursor-pointer outline-none"
                                aria-label="Select Language"
                                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                            >
                                {languages.map(({ code, label }) => (
                                    <option key={code} value={code} style={{ color: '#000', background: '#fff' }}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            aria-label="Notifications"
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition flex-shrink-0"
                        >
                            <Bell className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Weather strip ── */}
            <div className="bg-amber-600 border-b border-amber-700/40 w-full px-3 py-1.5 overflow-hidden">
                <div className="flex items-center gap-3 text-[11px] text-amber-50 overflow-x-auto scrollbar-none whitespace-nowrap">
                    {loc && (
                        <span className="flex items-center gap-1 font-semibold flex-shrink-0">
                            <MapPin className="w-3 h-3 flex-shrink-0" />{loc}
                        </span>
                    )}
                    {w ? (
                        <>
                            <span className="flex items-center gap-1 flex-shrink-0">
                                <span>{weatherEmoji(w.code)}</span>
                                <strong className="text-white">{w.temp}°C</strong>
                            </span>
                            <span className="flex-shrink-0"><Droplets className="inline w-3 h-3 mr-0.5" />{t('weather.humidity')} {w.humidity}%</span>
                            <span className="flex-shrink-0"><Wind className="inline w-3 h-3 mr-0.5" />{w.wind} km/h</span>
                            <span className="flex-shrink-0"><Thermometer className="inline w-3 h-3 mr-0.5" />{t('weather.feels')} {w.feels}°C</span>
                        </>
                    ) : (
                        <span className="opacity-60">{t('weather.loading')}</span>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
