const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool, initDB } = require('./db');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const PORT = process.env.PORT || 5000;

// Initialize DB
initDB();

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public/uploads/');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Photo upload endpoint
app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });
});

// Diary routes
app.get('/api/diary', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM diary ORDER BY date DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/diary', async (req, res) => {
    const { title, description, image_url, date } = req.body;
    console.log('Diary Save Attempt:', { title, date });
    try {
        const useDate = date && date.trim() !== "";
        const query = useDate
            ? 'INSERT INTO diary (title, description, image_url, date) VALUES (?, ?, ?, ?)'
            : 'INSERT INTO diary (title, description, image_url) VALUES (?, ?, ?)';
        const params = useDate
            ? [title, description, image_url, date]
            : [title, description, image_url];

        const [result] = await pool.query(query, params);
        res.status(201).json({ id: result.insertId, title, description, image_url, date });
    } catch (err) {
        console.error('SERVER ERROR Diary:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Memory routes
app.get('/api/memories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM memories ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/memories', async (req, res) => {
    const { description, image_url, date } = req.body;
    console.log('Memory Save Attempt:', { description: description?.substring(0, 20), date });
    try {
        const useDate = date && date.trim() !== "";
        const query = useDate
            ? 'INSERT INTO memories (description, image_url, created_at) VALUES (?, ?, ?)'
            : 'INSERT INTO memories (description, image_url) VALUES (?, ?)';
        const params = useDate
            ? [description, image_url, date]
            : [description, image_url];

        const [result] = await pool.query(query, params);
        res.status(201).json({ id: result.insertId, description, image_url, created_at: date });
    } catch (err) {
        console.error('SERVER ERROR Memory:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
