import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/+$/, '');

const UploadWidget = ({ onSuccess }) => {
    const { t } = useLanguage();
    const [file, setFile] = useState(null);
    const [phase, setPhase] = useState('idle'); // idle | uploading | processing | done | error
    const [msg, setMsg] = useState('');

    const pick = (e) => {
        const f = e.target.files?.[0];
        if (f) { setFile(f); setPhase('idle'); setMsg(''); }
    };

    const clear = (e) => { e.preventDefault(); e.stopPropagation(); setFile(null); setPhase('idle'); setMsg(''); };

    const upload = async () => {
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        try {
            setPhase('uploading'); setMsg(t('upload.uploading'));
            await axios.post(`${API}/api/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setPhase('processing'); setMsg(t('upload.processing'));
            await axios.post(`${API}/api/ml/run-pipeline`);
            setPhase('done'); setMsg(t('upload.success'));
            onSuccess?.();
        } catch {
            setPhase('error'); setMsg(t('upload.error'));
        }
    };

    const busy = phase === 'uploading' || phase === 'processing';
    const statusStyle = {
        done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        error: 'bg-red-50 text-red-700 border-red-200',
    }[phase] || '';

    return (
        <section id="upload-section">
            <p className="section-label">{t('upload.title')}</p>

            <div className="card overflow-hidden">
                {/* Drop zone */}
                <label
                    htmlFor="sf-file"
                    className={`block cursor-pointer p-8 text-center transition-colors ${file ? 'bg-amber-50 border-b border-amber-100' : 'hover:bg-stone-50'
                        }`}
                >
                    <div className="flex flex-col items-center gap-3">
                        {file
                            ? <FileText className="w-10 h-10 text-amber-500" />
                            : <UploadCloud className="w-10 h-10 text-stone-300" />}
                        {file ? (
                            <div className="flex items-center gap-2 text-stone-700 font-semibold text-sm">
                                <span className="truncate max-w-[200px]">{file.name}</span>
                                <button onClick={clear} className="text-stone-400 hover:text-red-500 flex-shrink-0" aria-label="Remove">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="font-bold text-stone-600 text-sm">{t('upload.choose')}</span>
                                <span className="text-xs text-stone-400">{t('upload.desc')}</span>
                            </>
                        )}
                    </div>
                    <input id="sf-file" type="file" accept=".csv,.xlsx,.xls,.json" className="sr-only" onChange={pick} aria-label={t('upload.title')} />
                </label>

                {/* CTA */}
                <div className="p-4">
                    <button disabled={!file || busy} onClick={upload} className="btn-primary">
                        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {msg}</> : t('upload.btn')}
                    </button>
                </div>

                {/* Status */}
                {msg && !busy && (
                    <div aria-live="polite" className={`flex items-center gap-2 mx-4 mb-4 px-4 py-3 rounded-xl border text-sm font-semibold ${statusStyle}`}>
                        {phase === 'done' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        {msg}
                    </div>
                )}
            </div>
        </section>
    );
};

export default UploadWidget;
