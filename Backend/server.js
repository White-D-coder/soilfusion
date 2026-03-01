const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Setup Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `sensor_readings${ext}`);
    }
});

const upload = multer({ storage: storage });

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SoilFusion Backend is running!' });
});

// Upload Data Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ message: 'File uploaded successfully', filename: req.file.filename });
});

// ML Pipeline Endpoints
app.post('/api/ml/run-pipeline', (req, res) => {
    const mlScriptPath = path.join(__dirname, '..', 'ml_pipeline.py');
    const venvPythonPath = path.join(__dirname, '..', 'venv', 'bin', 'python3');
    const cwdPath = path.join(__dirname, '..');

    const pythonProcess = spawn(venvPythonPath, [mlScriptPath], { cwd: cwdPath });

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
        console.log(`ML Output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`ML Process exited with code ${code}`);
            return res.status(500).json({ error: 'ML Pipeline execution failed', details: errorData });
        }
        res.json({ message: 'ML Pipeline completed successfully', output: outputData });
    });
});

app.post('/api/ml/predict', (req, res) => {
    const { field_id, lang } = req.body;
    if (!field_id) {
        return res.status(400).json({ error: 'field_id is required' });
    }

    const inferenceScriptPath = path.join(__dirname, 'inference.py');
    const venvPythonPath = path.join(__dirname, '..', 'venv', 'bin', 'python3');
    const cwdPath = path.join(__dirname, '..');

    const args = [inferenceScriptPath, field_id.toString()];
    if (lang) {
        args.push(lang);
    }

    const pythonProcess = spawn(venvPythonPath, args, { cwd: cwdPath });

    let outputData = '';

    pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
    });

    pythonProcess.on('close', (code) => {
        // Extract JSON from output that might contain python print logs
        const jsonMatch = outputData.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : outputData;

        if (code !== 0) {
            try {
                const results = JSON.parse(cleanJson);
                if (results.error) return res.status(500).json(results);
            } catch (err) { }
            return res.status(500).json({ error: 'Inference failed', raw: outputData });
        }
        try {
            const results = JSON.parse(cleanJson);
            res.json(results);
        } catch (err) {
            res.status(500).json({ error: 'Failed to parse inference output', raw: outputData });
        }
    });
});

app.get('/api/ml/fields', (req, res) => {
    try {
        const filePath = path.join(__dirname, '..', 'data', 'sensor_readings.csv');
        if (!fs.existsSync(filePath)) {
            return res.json({ fields: [] });
        }
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.trim().split('\n');
        if (lines.length < 2) return res.json({ fields: [] });

        const header = lines[0].split(',');
        const fieldIdx = header.findIndex(col => col.trim() === 'field_id');
        const farmerIdx = header.findIndex(col => col.trim() === 'farmer_name');

        if (fieldIdx === -1) return res.json({ fields: [] });

        const fieldMap = new Map();
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols[fieldIdx]) {
                const id = cols[fieldIdx].trim();
                if (!id) continue;

                let farmerName = id;
                if (farmerIdx !== -1 && cols[farmerIdx]) {
                    farmerName = cols[farmerIdx].trim() || id;
                }

                if (!fieldMap.has(id)) {
                    fieldMap.set(id, farmerName);
                }
            }
        }

        const fieldsArray = Array.from(fieldMap.entries()).map(([id, name]) => ({ id, name }));
        res.json({ fields: fieldsArray });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fields' });
    }
});

// Configure keeping the server awake on Render Free Tier
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
setInterval(() => {
    fetch(`${RENDER_EXTERNAL_URL}/api/health`)
        .then(res => res.json())
        .then(data => console.log('Keep-alive ping successful:', data.message))
        .catch(err => console.error('Keep-alive ping failed:', err.message));
}, 10 * 60 * 1000); // Ping every 10 minutes

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} / External URL: ${RENDER_EXTERNAL_URL}`);
});
