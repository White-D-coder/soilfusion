import React, { createContext, useContext, useState, useCallback } from 'react';
import { T, LANGUAGES } from '../translations';

const Ctx = createContext(null);

const LANG_CODES = LANGUAGES.map(l => l.code);

const detect = () => {
    const s = localStorage.getItem('sf_lang');
    if (s && LANG_CODES.includes(s)) return s;
    const nav = navigator.language?.toLowerCase() ?? '';
    if (nav.startsWith('hi')) return 'hi';
    if (nav.startsWith('mr')) return 'mr';
    if (nav.startsWith('pa')) return 'pa';
    if (nav.startsWith('gu')) return 'gu';
    if (nav.startsWith('bn')) return 'bn';
    if (nav.startsWith('te')) return 'te';
    if (nav.startsWith('ta')) return 'ta';
    if (nav.startsWith('kn')) return 'kn';
    if (nav.startsWith('or')) return 'od';
    return 'en';
};

/* eslint-disable react-refresh/only-export-components */
export const LanguageProvider = ({ children }) => {
    const [lang, setL] = useState(detect);
    const setLang = useCallback((l) => { setL(l); localStorage.setItem('sf_lang', l); }, []);
    const t = useCallback((k) => T[lang]?.[k] ?? T['en']?.[k] ?? k, [lang]);
    // `languages` array passed through context so Header can render the dropdown
    return <Ctx.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>{children}</Ctx.Provider>;
};

export const useLanguage = () => {
    const c = useContext(Ctx);
    if (!c) throw new Error('useLanguage outside LanguageProvider');
    return c;
};
