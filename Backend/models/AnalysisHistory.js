const mongoose = require('mongoose');

const AnalysisHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fieldId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    yieldPrediction: { type: Number },
    anomalyDetected: { type: Boolean, default: false },
    soilHealth: { type: String },  // "healthy" | "critical"
    targetCrop: { type: String },
    confidenceScore: { type: String },
    soilMetrics: {
        moisture: Number,
        ph: Number,
        nitrogen: Number,
        temperature: Number,
    },
    recommendation: { type: mongoose.Schema.Types.Mixed },
});

module.exports = mongoose.model('AnalysisHistory', AnalysisHistorySchema);
