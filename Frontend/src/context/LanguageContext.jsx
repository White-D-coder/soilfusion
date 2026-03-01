import React, { createContext, useContext, useState, useCallback } from 'react';
import { T } from '../translations';

const Ctx = createContext(null);

const detect = () => {
    const s = localStorage.getItem('sf_lang');
    if (s) return s;
    return navigator.language?.startsWith('hi') ? 'hi' : 'en';
};

export const LanguageProvider = ({ children }) => {
    const [lang, setL] = useState(detect);
    const setLang = useCallback((l) => { setL(l); localStorage.setItem('sf_lang', l); }, []);
    const t = useCallback((k) => T[lang]?.[k] ?? T['en']?.[k] ?? k, [lang]);
    return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
};

export const useLanguage = () => {
    const c = useContext(Ctx);
    if (!c) throw new Error('useLanguage outside LanguageProvider');
    return c;
};
