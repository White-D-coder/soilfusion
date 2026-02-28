import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Activity, Sprout, AlertTriangle, CheckCircle2, CloudFog, Loader2 } from 'lucide-react';

const Dashboard = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    const [fieldId, setFieldId] = useState('100001');
    const [insight, setInsight] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const uploadAndRunPipeline = async () => {
        if (!file) {
            alert("Please select a file first (CSV/Excel/JSON)");
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

            fetchInference();

        } catch (err) {
            console.error(err);
            setStatusMsg('Error occurred: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchInference = async () => {
        setLoading(true);
        setStatusMsg('Fetching Field Insights...');
        try {
            const res = await axios.post('http://localhost:5001/api/ml/predict', { field_id: parseInt(fieldId) });
            setInsight(res.data);
            setStatusMsg('Insights ready!');
        } catch (err) {
            console.error(err);
            setStatusMsg('Error fetching insight: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
            setTimeout(() => setStatusMsg(''), 3000);
        }
    };

    return (
        <div className="space-y-6">

            {/* Upload Widget */}
            <div className="glass-panel p-6 flex flex-col md:flex-row gap-6 items-center justify-between transition-all hover:bg-brand-surface/90">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                        <Upload className="text-emerald-400" /> Sensor Log Ingestion
                    </h2>
                    <p className="text-slate-400 text-sm">Upload your raw CSV, Excel, or JSON sensor logs to kickstart ML model training.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <input
                        type="file"
                        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer"
                        onChange={handleFileChange}
                    />
                    <button
                        disabled={loading}
                        onClick={uploadAndRunPipeline}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl font-bold text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Process Data'}
                    </button>
                </div>
            </div>

            {statusMsg && (
                <div className="text-center p-3 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20 animate-pulse">
                    {statusMsg}
                </div>
            )}

            {/* Field Selector & Fetch */}
            <div className="glass-panel p-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 border-b border-slate-700/50 pb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="text-teal-400" /> Farm Field Intelligence
                    </h2>
                    <div className="flex gap-3">
                        <input
                            type="number"
                            value={fieldId}
                            onChange={(e) => setFieldId(e.target.value)}
                            className="bg-brand-dark border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500 text-white w-32"
                            placeholder="Field ID"
                        />
                        <button
                            onClick={fetchInference}
                            disabled={loading}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-all"
                        >
                            Analyze
                        </button>
                    </div>
                </div>

                {/* Inference Results Screen */}
                {insight ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        <div className={`p-6 rounded-2xl border ${insight.anomaly_detected ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${insight.anomaly_detected ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                    {insight.anomaly_detected ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Soil Condition</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-1 text-white">
                                {insight.anomaly_detected ? 'Anomaly Detected' : 'Optimal Health'}
                            </h3>
                            <p className="text-slate-400 text-sm">
                                {insight.anomaly_detected
                                    ? 'Abnormal soil patterns recorded. Delay planting and check parameters.'
                                    : 'Soil conditions are stable and matching healthy trends.'}
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl border border-slate-700/50 bg-brand-dark/50 hover:bg-brand-dark/80 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                                    <CloudFog className="w-8 h-8" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ML Forecast</span>
                            </div>
                            <h3 className="text-3xl font-bold mb-1 text-white">
                                {insight.yield_prediction_kg_per_ha.toFixed(1)} <span className="text-lg text-slate-400 font-medium">kg/ha</span>
                            </h3>
                            <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400"></span> Expected Yield based on current features
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-surface to-brand-dark border border-slate-700/50">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-500">
                                    <Sprout className="w-8 h-8" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Advisory Logic</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-white font-bold">{insight.recommendation.Target_Crop}</h4>
                                    <p className="text-xs text-slate-400">Recommended Crop</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                                        <div className="h-full bg-amber-500" style={{ width: insight.recommendation.Confidence_Score }}></div>
                                    </div>
                                    <span className="text-sm font-bold text-amber-500">{insight.recommendation.Confidence_Score}</span>
                                </div>

                                <div className="pt-2 mt-2 border-t border-slate-700/50 flex justify-between">
                                    <span className="text-xs text-slate-400">Start Date:</span>
                                    <span className="text-xs font-bold text-teal-400">{insight.recommendation.Recommended_Start_Date}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="py-12 text-center border-2 border-dashed border-slate-700/50 rounded-2xl bg-brand-dark/30">
                        <Sprout className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h3 className="text-slate-400 font-medium">No Data Loaded</h3>
                        <p className="text-slate-500 text-sm mt-1">Upload files or enter a Field ID to run inference</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Dashboard;
