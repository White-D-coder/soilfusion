require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const mongoose = require('mongoose');
const passport = require('./config/passport');
const AnalysisHistory = require('./models/AnalysisHistory');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── MongoDB Connection ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/soilfusion')
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,   // Required for cookies/sessions across origins
}));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'soilfusion-dev-secret',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/soilfusion',
        ttl: 7 * 24 * 60 * 60,
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
}));

app.use(passport.initialize());
app.use(passport.session());

// ── Auth Middleware ─────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Not authenticated' });
};

// ── Auth Routes ─────────────────────────────────────────────────────────────
// 1. Start Google OAuth flow
app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// 2. Google callback — auto-login after this, redirect to frontend dashboard
app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=auth_failed` }),
    (req, res) => {
        // Successful auth → redirect to frontend (new users are auto-registered)
        res.redirect(`${FRONTEND_URL}/dashboard`);
    }
);
app.get("/", (req, res) => {
    res.send("SoilFusion API is running");
});


// 4. Logout
app.get('/api/auth/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy();
        res.json({ message: 'Logged out successfully' });
    });
});

// 5. Demo login (for UI testing — bypasses Google OAuth)
app.post('/api/auth/demo', (req, res) => {
    const demoUser = {
        _id: 'demo-user-001',
        id: 'demo-user-001',
        name: '🌾 Demo Farmer',
        email: 'demo@soilfusion.app',
        picture: null,
    };
    req.session.demoUser = demoUser;
    res.json({ user: demoUser });
});

// Get current logged-in user (also checks demo session)
app.get('/api/auth/me', (req, res) => {
    if (req.session?.demoUser) return res.json({ user: req.session.demoUser });
    if (!req.user) return res.json({ user: null });
    res.json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            picture: req.user.picture,
        }
    });
});

// ── Analysis History Routes ─────────────────────────────────────────────────
// Get current user's history (last 20 analyses)
app.get('/api/history', requireAuth, async (req, res) => {
    try {
        const history = await AnalysisHistory.find({ userId: req.user._id })
            .sort({ timestamp: -1 })
            .limit(20);
        res.json({ history });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Delete a specific history entry
app.delete('/api/history/:id', requireAuth, async (req, res) => {
    try {
        await AnalysisHistory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// ── File Upload ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `sensor_readings${ext}`);
    }
});
const upload = multer({ storage });

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'SoilFusion Backend is running!' }));

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ message: 'File uploaded successfully', filename: req.file.filename });
});

// ── ML Pipeline ─────────────────────────────────────────────────────────────
app.post('/api/ml/run-pipeline', (req, res) => {
    const mlScriptPath = path.join(__dirname, '..', 'ml_pipeline.py');
    const venvPythonPath = path.join(__dirname, '..', 'venv', 'bin', 'python3');
    const cwdPath = path.join(__dirname, '..');
    const pythonProcess = spawn(venvPythonPath, [mlScriptPath], { cwd: cwdPath });

    let outputData = '', errorData = '';
    pythonProcess.stdout.on('data', d => { outputData += d.toString(); console.log(`ML: ${d}`); });
    pythonProcess.stderr.on('data', d => { errorData += d.toString(); });
    pythonProcess.on('close', code => {
        if (code !== 0) return res.status(500).json({ error: 'ML Pipeline failed', details: errorData });
        res.json({ message: 'ML Pipeline completed', output: outputData });
    });
});

app.post('/api/ml/predict', async (req, res) => {
    const { field_id, lang } = req.body;
    if (!field_id) return res.status(400).json({ error: 'field_id is required' });

    const inferenceScriptPath = path.join(__dirname, 'inference.py');
    const venvPythonPath = path.join(__dirname, '..', 'venv', 'bin', 'python3');
    const cwdPath = path.join(__dirname, '..');
    const args = [inferenceScriptPath, field_id.toString()];
    if (lang) args.push(lang);

    const pythonProcess = spawn(venvPythonPath, args, { cwd: cwdPath });
    let outputData = '';
    pythonProcess.stdout.on('data', d => { outputData += d.toString(); });
    pythonProcess.on('close', async code => {
        const jsonMatch = outputData.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : outputData;
        if (code !== 0) {
            try {
                const r = JSON.parse(cleanJson);
                if (r.error) return res.status(500).json(r);
            } catch (_) { }
            return res.status(500).json({ error: 'Inference failed', raw: outputData });
        }
        try {
            const results = JSON.parse(cleanJson);

            // ── Save to MongoDB if user is logged in ──────────────────────
            if (req.isAuthenticated && req.isAuthenticated()) {
                const latest = results.historical_data?.at?.(-1);
                await AnalysisHistory.create({
                    userId: req.user._id,
                    fieldId: field_id.toString(),
                    yieldPrediction: results.yield_prediction_kg_per_ha,
                    anomalyDetected: results.anomaly_detected,
                    soilHealth: results.anomaly_detected ? 'critical' : 'healthy',
                    targetCrop: results.recommendation?.Target_Crop,
                    confidenceScore: results.recommendation?.Confidence_Score,
                    soilMetrics: {
                        moisture: latest?.moisture,
                        ph: latest?.ph,
                        nitrogen: latest?.nitrogen,
                        temperature: latest?.temperature,
                    },
                    recommendation: results.recommendation,
                }).catch(err => console.warn('History save skipped:', err.message));
            }

            res.json(results);
        } catch (err) {
            res.status(500).json({ error: 'Failed to parse inference output', raw: outputData });
        }
    });
});

app.get('/api/ml/fields', (req, res) => {
    try {
        const filePath = path.join(__dirname, '..', 'data', 'sensor_readings.csv');
        if (!fs.existsSync(filePath)) return res.json({ fields: [] });
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.trim().split('\n');
        if (lines.length < 2) return res.json({ fields: [] });

        const header = lines[0].split(',');
        const fieldIdx = header.findIndex(c => c.trim() === 'field_id');
        const farmerIdx = header.findIndex(c => c.trim() === 'farmer_name');
        if (fieldIdx === -1) return res.json({ fields: [] });

        const fieldMap = new Map();
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            const id = cols[fieldIdx]?.trim();
            if (!id) continue;
            if (!fieldMap.has(id)) {
                fieldMap.set(id, farmerIdx !== -1 ? (cols[farmerIdx]?.trim() || id) : id);
            }
        }
        res.json({ fields: Array.from(fieldMap.entries()).map(([id, name]) => ({ id, name })) });
    } catch {
        res.status(500).json({ error: 'Failed to fetch fields' });
    }
});

// ── Keep-alive (Render free tier) ──────────────────────────────────────────
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
setInterval(() => {
    fetch(`${RENDER_URL}/api/health`)
        .then(r => r.json())
        .then(d => console.log('Keep-alive:', d.message))
        .catch(e => console.error('Keep-alive failed:', e.message));
}, 10 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
