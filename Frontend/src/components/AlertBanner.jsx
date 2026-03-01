import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = { warning: AlertTriangle, error: AlertCircle, info: Info };
const STYLES = {
    warning: 'bg-amber-50 border-l-amber-500 text-amber-800',
    error: 'bg-red-50 border-l-red-500 text-red-800',
    info: 'bg-blue-50 border-l-blue-500 text-blue-800',
};

const AlertBanner = ({ message, type = 'warning' }) => {
    const [show, setShow] = useState(true);
    if (!show) return null;
    const Icon = ICONS[type] ?? AlertTriangle;
    return (
        <div role="alert" aria-live="assertive" className={`flex items-start gap-3 px-4 py-3 border-l-4 text-sm font-semibold ${STYLES[type] ?? STYLES.warning}`}>
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="flex-1 leading-snug">{message}</span>
            <button onClick={() => setShow(false)} aria-label="Dismiss" className="opacity-50 hover:opacity-100 transition flex-shrink-0">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default AlertBanner;
