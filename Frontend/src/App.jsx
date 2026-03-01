import React from 'react';
import { useTranslation } from 'react-i18next';
import Dashboard from './components/Dashboard';

function App() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-emerald-700 border-b border-emerald-800 p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-700 font-bold text-xl shadow-inner">
              SF
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              {t('app_title')}
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => changeLanguage('en')}
              className={`px-3 py-1 rounded-md text-sm font-semibold transition-all ${i18n.language === 'en' ? 'bg-white text-emerald-800 shadow-sm' : 'bg-emerald-800/50 text-emerald-100 hover:bg-emerald-600'}`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('hi')}
              className={`px-3 py-1 rounded-md text-sm font-semibold transition-all ${i18n.language === 'hi' ? 'bg-white text-emerald-800 shadow-sm' : 'bg-emerald-800/50 text-emerald-100 hover:bg-emerald-600'}`}
            >
              हिं
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
