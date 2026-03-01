import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Clock, Trash2, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/+$/, '');

const HistoryPanel = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!user || !open) return;
        setLoading(true);
        fetch(`${API}/api/history`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => { setHistory(data.history || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [user, open]);

    const deleteEntry = async (id) => {
        await fetch(`${API}/api/history/${id}`, { method: 'DELETE', credentials: 'include' });
        setHistory(prev => prev.filter(h => h._id !== id));
    };

    if (!user) return null;

    return (
        <div style={styles.wrapper}>
            {/* Toggle header */}
            <button style={styles.toggle} onClick={() => setOpen(o => !o)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} />
                    <strong>Purane Analysis (History)</strong>
                    {history.length > 0 && (
                        <span style={styles.badge}>{history.length}</span>
                    )}
                </span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* History list */}
            {open && (
                <div>
                    {loading && <p style={styles.loading}>Loading history…</p>}
                    {!loading && history.length === 0 && (
                        <p style={styles.empty}>Abhi tak koi analysis nahi ki. Apna pehla field check karein!</p>
                    )}
                    {history.map(h => (
                        <div key={h._id} style={styles.card}>
                            <div style={styles.cardTop}>
                                <div>
                                    <span style={styles.fieldLabel}>Field {h.fieldId}</span>
                                    {h.targetCrop && (
                                        <span style={styles.crop}> · {h.targetCrop}</span>
                                    )}
                                    <div style={styles.date}>
                                        {new Date(h.timestamp).toLocaleDateString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {/* Health icon */}
                                    {h.anomalyDetected
                                        ? <AlertTriangle size={18} color="#E74C3C" />
                                        : <CheckCircle2 size={18} color="#27AE60" />
                                    }
                                    <button style={styles.deleteBtn} onClick={() => deleteEntry(h._id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Metrics row */}
                            <div style={styles.metrics}>
                                {h.yieldPrediction != null && (
                                    <span style={styles.metricChip}>
                                        <TrendingUp size={12} /> {Math.round(h.yieldPrediction)} kg/ha
                                    </span>
                                )}
                                {h.soilMetrics?.moisture != null && (
                                    <span style={styles.metricChip}>
                                        💧 {h.soilMetrics.moisture.toFixed(1)}%
                                    </span>
                                )}
                                {h.soilMetrics?.ph != null && (
                                    <span style={styles.metricChip}>
                                        ⚗️ pH {h.soilMetrics.ph.toFixed(1)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    wrapper: { border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', marginBottom: 16, background: '#FAFAFA' },
    toggle: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#374151' },
    badge: { background: '#F59E0B', color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 },
    loading: { textAlign: 'center', padding: 16, color: '#9CA3AF', fontSize: 13 },
    empty: { textAlign: 'center', padding: '16px', color: '#9CA3AF', fontSize: 13, margin: 0 },
    card: { borderTop: '1px solid #F3F4F6', padding: '12px 16px' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    fieldLabel: { fontWeight: 700, fontSize: 14, color: '#111827' },
    crop: { fontSize: 13, color: '#6B7280' },
    date: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 },
    metrics: { display: 'flex', gap: 6, flexWrap: 'wrap' },
    metricChip: { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F3F4F6', borderRadius: 99, padding: '3px 10px', fontSize: 12, color: '#374151' },
};

export default HistoryPanel;
