import React from 'react';
import { CloudUpload, SearchCheck, Leaf } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const steps = [
    { icon: <Leaf className="w-7 h-7 text-amber-500" />, key: 'step1' },
    { icon: <CloudUpload className="w-7 h-7 text-amber-500" />, key: 'step2' },
    { icon: <SearchCheck className="w-7 h-7 text-amber-500" />, key: 'step3' },
];

const FarmerGuide = () => {
    const { t } = useLanguage();

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <section className="sf-card p-6 md:p-8 animate-slide-up" aria-label="Getting started guide">
            {/* Badge */}
            <span className="pill-badge bg-amber-100 text-amber-700 mb-4 inline-flex">
                🌾 {t('guide.badge')}
            </span>

            <h2 className="text-2xl md:text-3xl font-extrabold text-stone-800 mb-1">{t('guide.title')}</h2>
            <p className="text-stone-500 text-sm mb-6">{t('guide.subtitle')}</p>

            {/* Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                {steps.map(({ icon, key }, i) => (
                    <div
                        key={key}
                        className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow"
                        style={{ animationDelay: `${i * 80}ms` }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-extrabold text-amber-300 leading-none">{`0${i + 1}`}</span>
                            {icon}
                        </div>
                        <div>
                            <p className="font-bold text-stone-800 text-sm">{t(`guide.${key}.title`)}</p>
                            <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{t(`guide.${key}.desc`)}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => scrollTo('upload-section')}
                    className="sf-btn-primary flex-1 text-sm"
                >
                    {t('guide.cta.upload')}
                </button>
                <button
                    onClick={() => scrollTo('analyze-section')}
                    className="sf-btn-outline flex-1 text-sm"
                >
                    {t('guide.cta.analyze')}
                </button>
            </div>
        </section>
    );
};

export default FarmerGuide;
