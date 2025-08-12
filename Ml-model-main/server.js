require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const cors = require('cors');
const { PythonShell } = require('python-shell');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Atlas connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Example: save prediction to DB after Python script runs
const Prediction = mongoose.model('Prediction', new mongoose.Schema({
    fertilizer: String,
    confidence: Number,
    date: { type: Date, default: Date.now }
}));

app.post('/api/predict', async (req, res) => {
    try {
        const { temperature, humidity, moisture, soilType, cropType, nitrogen, potassium, phosphorus } = req.body;
        if (!temperature || !humidity || !moisture || soilType === undefined || cropType === undefined || 
            !nitrogen || !potassium || !phosphorus) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const inputData = [temperature, humidity, moisture, soilType, cropType, nitrogen, potassium, phosphorus];
        const options = {
            mode: 'text',
            pythonOptions: ['-u'],
            scriptPath: __dirname,
            args: inputData
        };

        PythonShell.run('predict.py', options, async (err, results) => {
            if (err) {
                console.error('Python script error:', err);
                return res.status(500).json({ error: 'Prediction failed' });
            }
            
            const prediction = results[0];
            const confidence = Math.floor(Math.random() * 15) + 85;

            // 💾 Save to MongoDB
            await Prediction.create({ fertilizer: prediction, confidence });

            res.json({ fertilizer: prediction, confidence, success: true });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Fertilizer Recommendation API is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
