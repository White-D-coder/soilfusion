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
        cb(null, file.originalname);
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

        if (fieldIdx === -1) return res.json({ fields: [] });

        const fields = new Set();
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols[fieldIdx]) {
                const id = cols[fieldIdx].trim();
                if (id) fields.add(id);
            }
        }
        res.json({ fields: Array.from(fields) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fields' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
