import React, { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * FarmerSummarizer
 * Reads raw soil metric values and generates a layman-language summary
 * for the farmer explaining exactly what is wrong and what to do.
 *
 * Props:
 *   moisture    – number (%)
 *   ph          – number
 *   nitrogen    – number (ppm)
 *   anomaly     – boolean (was any anomaly detected?)
 *   yieldKg     – number (predicted kg/hectare)
 *   cropName    – string
 */
const FarmerSummarizer = ({ moisture, ph, nitrogen, anomaly, yieldKg, cropName }) => {
    const { t } = useLanguage();

    const issues = useMemo(() => {
        const found = [];

        // ── Moisture check ──────────────────────────────────────────
        if (moisture != null) {
            if (moisture < 18) found.push({ key: 'dry', severity: 'high', icon: '💧' });
            else if (moisture > 50) found.push({ key: 'wet', severity: 'medium', icon: '🌊' });
        }

        // ── pH check ────────────────────────────────────────────────
        if (ph != null) {
            if (ph > 7.8) found.push({ key: 'ph_high', severity: 'medium', icon: '⬆️' });
            else if (ph < 5.5) found.push({ key: 'ph_low', severity: 'medium', icon: '⬇️' });
        }

        // ── Nitrogen check ──────────────────────────────────────────
        if (nitrogen != null && nitrogen < 35) {
            found.push({ key: 'nitrogen', severity: 'high', icon: '🌿' });
        }

        // ── Anomaly check (sensor alert) ────────────────────────────
        if (anomaly) {
            found.push({ key: 'anomaly', severity: 'critical', icon: '⚠️' });
        }

        return found;
    }, [moisture, ph, nitrogen, anomaly]);

    const isReady = issues.filter(i => i.severity !== 'anomaly').length === 0;

    const summaryTextMap = {
        dry: t('sumDry'),
        wet: t('sumDry'),   // reuse for now
        ph_high: t('sumPh_high'),
        ph_low: t('sumPh_low'),
        nitrogen: t('sumN'),
        anomaly: t('sumAnomaly'),
    };

    const severityColors = {
        high: { bg: '#FFF3CD', border: '#FF9800', text: '#7B4F00' },
        medium: { bg: '#E8F5E9', border: '#66BB6A', text: '#1B5E20' },
        critical: { bg: '#FFEBEE', border: '#EF5350', text: '#7B0000' },
    };

    return (
        <div style={styles.wrapper}>
            <h3 style={styles.heading}>🌾 {t('sumTitle')}</h3>

            {/* ── Overall readiness badge ── */}
            <div style={{ ...styles.readyBadge, background: isReady ? '#D4EDDA' : '#F8D7DA', color: isReady ? '#155724' : '#721c24' }}>
                {isReady ? `✅ ${t('sumReady')}` : `❌ ${t('sumNotReady')}`}
            </div>

            {/* ── No issues → all good card ── */}
            {issues.length === 0 ? (
                <div style={{ ...styles.card, background: '#D4EDDA', borderColor: '#28A745' }}>
                    <span style={{ fontSize: 22, marginRight: 8 }}>🌱</span>
                    <span style={{ color: '#155724', fontWeight: 600 }}>{t('sumGood')}</span>
                </div>
            ) : (
                issues.map((issue) => {
                    const colors = severityColors[issue.severity] || severityColors.medium;
                    return (
                        <div key={issue.key}
                            style={{ ...styles.card, background: colors.bg, borderColor: colors.border }}>
                            <span style={{ fontSize: 20, marginRight: 10 }}>{issue.icon}</span>
                            <span style={{ color: colors.text, fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
                                {summaryTextMap[issue.key] ?? issue.key}
                            </span>
                        </div>
                    );
                })
            )}

            {/* ── Yield info ── */}
            {yieldKg != null && (
                <div style={styles.yieldRow}>
                    <span>📊</span>
                    <span>
                        {cropName && <strong>{cropName}: </strong>}
                        <span style={{ color: yieldKg > 3000 ? '#27AE60' : '#E74C3C', fontWeight: 700 }}>
                            {Math.round(yieldKg).toLocaleString()} kg/hectare
                        </span>
                    </span>
                </div>
            )}
        </div>
    );
};

const styles = {
    wrapper: {
        background: '#FAFAF7',
        border: '1px solid #E0E0D6',
        borderRadius: 14,
        padding: '18px 16px',
        marginTop: 16,
        fontFamily: 'inherit',
    },
    heading: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 12,
        color: '#2C3E50',
    },
    readyBadge: {
        borderRadius: 8,
        padding: '8px 14px',
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 12,
        display: 'inline-block',
    },
    card: {
        display: 'flex',
        alignItems: 'flex-start',
        borderLeft: '4px solid',
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 10,
    },
    yieldRow: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        marginTop: 12,
        fontSize: 14,
        color: '#555',
    },
};

export default FarmerSummarizer;
