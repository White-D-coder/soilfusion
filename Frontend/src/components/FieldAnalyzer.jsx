import React from 'react';
import { ScanLine, Loader2, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FieldAnalyzer = ({ fieldId, setFieldId, fields, onAnalyze, loading }) => {
    const { t } = useLanguage();
    return (
        <section id="analyze-section">
            <p className="section-label">{t('analyze.title')}</p>
            <div className="card p-4 space-y-3">
                <div>
                    <label htmlFor="sf-field" className="block text-xs font-bold text-stone-500 mb-1.5">
                        {t('analyze.label')}
                        <span className="font-normal ml-1 text-stone-400">— {t('analyze.hint')}</span>
                    </label>

                    {fields.length > 0 ? (
                        <div className="relative">
                            <select
                                id="sf-field"
                                value={fieldId}
                                onChange={(e) => setFieldId(e.target.value)}
                                className="sf-input appearance-none pr-10"
                                aria-label={t('analyze.label')}
                            >
                                {fields.map((id) => <option key={id} value={id}>{id}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        </div>
                    ) : (
                        <input
                            id="sf-field"
                            type="number"
                            value={fieldId}
                            onChange={(e) => setFieldId(e.target.value)}
                            placeholder={t('analyze.placeholder')}
                            className="sf-input text-lg font-bold"
                            aria-label={t('analyze.label')}
                        />
                    )}
                </div>

                <button
                    disabled={!fieldId || loading}
                    onClick={() => onAnalyze(fieldId)}
                    className="btn-primary"
                >
                    {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('analyze.loading')}</>
                        : <><ScanLine className="w-4 h-4" /> {t('analyze.btn')}</>}
                </button>
            </div>
        </section>
    );
};

export default FieldAnalyzer;
