import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Activity, Sprout, AlertTriangle, CheckCircle2, CloudFog, Loader2, Clock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
    const { t, i18n } = useTranslation();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    const [fieldId, setFieldId] = useState('');
    const [availableFields, setAvailableFields] = useState([]);
    const [insight, setInsight] = useState(null);

    const fetchFields = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/ml/fields');
            if (res.data.fields && res.data.fields.length > 0) {
                setAvailableFields(res.data.fields);
                return res.data.fields[0];
            }
        } catch (e) { }
        return null;
    };

    useEffect(() => {
        fetchFields().then(firstId => {
            if (firstId) {
                setFieldId(firstId);
            }
        });
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const uploadAndRunPipeline = async () => {
        if (!file) {
            alert(t('upload_title'));
            return;
        }
        setLoading(true);
        setStatusMsg('Uploading file...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post('http://localhost:5001/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setStatusMsg('File uploaded! Triggering Pipeline... (this may take a few seconds)');

            const pipelineRes = await axios.post('http://localhost:5001/api/ml/run-pipeline');
            console.log("Pipeline output:", pipelineRes.data);
            setStatusMsg('Pipeline Finished Successfully!');

            const newFieldId = await fetchFields();
            if (newFieldId) {
                setFieldId(newFieldId);
                fetchInference(newFieldId); // Automatically fetch after upload
            } else {
                fetchInference();
            }

        } catch (err) {
            console.error(err);
            setStatusMsg('Error occurred: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchInference = async (idToFetch = fieldId) => {
        if (!idToFetch) return;
        setLoading(true);
        setStatusMsg('Fetching Field Insights...');
        try {
            const res = await axios.post('http://localhost:5001/api/ml/predict', {
                field_id: parseInt(idToFetch),
                lang: i18n.language // Pass current language to backend
            });
            setInsight(res.data);
            setStatusMsg('');
        } catch (err) {
            console.error(err);
            setStatusMsg('Error fetching insight: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Top Accuracy Badge */}
            <div className="flex justify-center mb-2">
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    {t('accuracy_badge')}
                </div>
            </div>

            {/* Upload Widget */}
            <div className="glass-panel p-6 flex flex-col md:flex-row gap-6 items-center justify-between transition-all">
                <div className="text-center md:text-left">
                    <h2 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2 mb-2 text-emerald-800">
                        <Upload className="text-emerald-500" /> {t('upload_title')}
                    </h2>
                    <p className="text-stone-500 text-sm">{t('upload_desc')}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <input
                        type="file"
                        className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        onChange={handleFileChange}
                    />
                    <button
                        disabled={loading}
                        onClick={uploadAndRunPipeline}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap w-full sm:w-auto"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : t('process_btn')}
                    </button>
                </div>
            </div>

            {statusMsg && (
                <div className="text-center p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse font-medium">
                    {statusMsg}
                </div>
            )}

            {/* Field Selector & Fetch */}
            <div className="glass-panel p-6 md:p-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8 pb-6 border-b border-stone-100">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-stone-800">
                        <Activity className="text-emerald-500 h-7 w-7" /> {t('select_field')}
                    </h2>
                    <div className="flex w-full sm:w-auto gap-3">
                        {availableFields.length > 0 ? (
                            <select
                                value={fieldId}
                                onChange={(e) => setFieldId(e.target.value)}
                                className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-stone-800 w-full sm:w-32 font-medium"
                            >
                                {availableFields.map(id => (
                                    <option key={id} value={id}>{id}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="number"
                                value={fieldId}
                                onChange={(e) => setFieldId(e.target.value)}
                                className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-stone-800 w-full sm:w-32 font-medium"
                                placeholder="ID"
                            />
                        )}
                        <button
                            onClick={() => fetchInference(fieldId)}
                            disabled={loading || !fieldId}
                            className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-bold transition-all whitespace-nowrap"
                        >
                            {t('get_insights')}
                        </button>
                    </div>
                </div>

                {/* Inference Results Screen */}
                {insight ? (
                    <div className="space-y-6">

                        {/* NLP Summary Banner */}
                        {insight.summary && (
                            <div className={`p-5 rounded-2xl border-l-4 shadow-sm ${insight.anomaly_detected ? 'bg-orange-50 border-orange-500' : 'bg-emerald-50 border-emerald-500'}`}>
                                <h3 className="font-bold mb-2 flex items-center gap-2 text-stone-800">
                                    <Sprout className="w-5 h-5" /> {t('ai_summary')}
                                </h3>
                                <p className="text-stone-600 whitespace-pre-line leading-relaxed text-sm md:text-base">
                                    {insight.summary}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {/* Anomaly & Recovery Card */}
                            <div className={`p-6 rounded-2xl border ${insight.anomaly_detected ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${insight.anomaly_detected ? 'bg-orange-200 text-orange-700' : 'bg-emerald-200 text-emerald-700'}`}>
                                        {insight.anomaly_detected ? <AlertTriangle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                                    </div>
                                </div>
                                <h3 className={`text-xl font-bold mb-1 ${insight.anomaly_detected ? 'text-orange-900' : 'text-emerald-900'}`}>
                                    {insight.anomaly_detected ? t('anomalies_detected') : t('no_anomalies')}
                                </h3>

                                {insight.recovery_time && insight.anomaly_detected && (
                                    <div className="mt-4 pt-4 border-t border-orange-200/60">
                                        <span className="text-xs font-bold uppercase text-orange-700/70 mb-1 block">{t('recovery_time')}</span>
                                        <div className="flex items-center gap-2 text-orange-800 font-bold">
                                            <Clock className="w-4 h-4" />
                                            {insight.recovery_time}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Yield Forecast Card */}
                            <div className="p-6 rounded-2xl border border-blue-100 bg-blue-50/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                                        <CloudFog className="w-7 h-7" />
                                    </div>
                                </div>
                                <span className="text-xs font-bold uppercase text-blue-500 mb-1 block">{t('expected_yield')}</span>
                                <h3 className="text-4xl font-extrabold text-blue-900">
                                    {insight.yield_prediction_kg_per_ha.toFixed(0)} <span className="text-xl text-blue-600/70 font-bold">kg/ha</span>
                                </h3>
                            </div>

                            {/* Recommendations Card */}
                            <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-xl bg-stone-100 text-stone-600">
                                        <Sprout className="w-7 h-7" />
                                    </div>
                                </div>

                                <span className="text-xs font-bold uppercase text-stone-400 mb-1 block">{t('target_crop')}</span>
                                <h4 className="text-xl font-bold text-stone-800 mb-4">{insight.recommendation.Target_Crop}</h4>

                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-stone-500 font-medium">{t('confidence')}</span>
                                            <span className="font-bold text-emerald-600">{insight.recommendation.Confidence_Score}</span>
                                        </div>
                                        <div className="w-full bg-stone-100 rounded-full h-2">
                                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: insight.recommendation.Confidence_Score }}></div>
                                        </div>
                                    </div>

                                    {insight.recommendation.Recommended_Start_Date !== 'N/A' && (
                                        <div className="pt-2 mt-2 border-t border-stone-100 flex justify-between items-center">
                                            <span className="text-xs text-stone-500 font-medium">{t('start_date')}:</span>
                                            <span className="text-sm font-bold text-stone-800">{insight.recommendation.Recommended_Start_Date}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="py-16 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                        <Sprout className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                        <h3 className="text-stone-500 font-bold text-lg">No Results Yet</h3>
                        <p className="text-stone-400 text-sm mt-1">Upload data or query a Field ID to view AI insights.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Dashboard;
