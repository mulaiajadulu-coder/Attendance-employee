const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection, syncDatabase } = require('./models');
const authRoutes = require('./routes/auth');
const absensiRoutes = require('./routes/absensi');
const cutiRoutes = require('./routes/cuti');
const koreksiRoutes = require('./routes/koreksi');
const profileRoutes = require('./routes/profile');
const userRoutes = require('./routes/user');
const jadwalRoutes = require('./routes/jadwal');
const notificationsRoutes = require('./routes/notifications');
const shiftRoutes = require('./routes/shift');
const shiftChangeRoutes = require('./routes/shiftChangeRoutes');
const outletRoutes = require('./routes/outlet');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, error: { message: 'Too many requests' } }
});
app.use(globalLimiter);

// CORS
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(o => o.trim().replace(/\/$/, ''))
    : [];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const normalized = origin.trim().replace(/\/$/, '');
        if (allowedOrigins.includes(normalized) || normalized.includes('localhost') || normalized.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('CORS Error'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// DB Init State
let isDbInitialized = false;
let dbInitError = null;

const initializeApp = async () => {
    if (isDbInitialized) return;
    try {
        await testConnection();
        // In serverless, we ONLY test connection. We don't sync on every request.
        if (process.env.VERCEL !== '1') {
            await syncDatabase();
        }
        isDbInitialized = true;
    } catch (error) {
        dbInitError = error;
        throw error;
    }
};

// Middleware to Ensure DB is ready
app.use(async (req, res, next) => {
    if (req.path === '/api/health' || req.path === '/health') return next();

    try {
        await initializeApp();
        next();
    } catch (error) {
        res.status(503).json({
            success: false,
            error: { message: 'Database connection failed', details: error.message }
        });
    }
});

// Routes
app.get('/api/health', async (req, res) => {
    try {
        await initializeApp();
        res.json({ success: true, db: 'connected', env: process.env.NODE_ENV });
    } catch (e) {
        res.json({ success: true, db: 'error', error: e.message });
    }
});

app.get('/health', (req, res) => res.json({ status: 'awake' }));

app.use('/api/auth', authRoutes);
app.use('/api/absensi', absensiRoutes);
app.use('/api/cuti', cutiRoutes);
app.use('/api/koreksi', koreksiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/shift-change', shiftChangeRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/notifications', notificationsRoutes);

// Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        success: false,
        error: { message: err.message || 'Internal Server Error' }
    });
});

// Non-Vercel Listen
if (process.env.VERCEL !== '1') {
    initializeApp().then(() => {
        app.listen(PORT, () => console.log(`✓ Server on ${PORT}`));
    }).catch(e => console.error('Startup failed', e));
}

module.exports = app;
