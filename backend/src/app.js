const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));

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

// DB Init State (Lazy Load)
let isDbInitialized = false;
let dbModels = null;

const initializeApp = async () => {
    if (isDbInitialized) return dbModels;
    try {
        console.log('Loading database models...');
        // Defer requiring models to prevent crashes at require-time
        dbModels = require('./models');

        console.log('Testing database connection...');
        await dbModels.testConnection();

        if (process.env.VERCEL !== '1') {
            await dbModels.syncDatabase();
        }

        isDbInitialized = true;
        return dbModels;
    } catch (error) {
        console.error('Initialization error:', error.message);
        throw error;
    }
};

// Lazy-loaded routes middleware
const loadRoutes = (req, res, next) => {
    try {
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

        next();
    } catch (e) {
        next(e);
    }
};

// Health check always works
app.get('/api/health', async (req, res) => {
    try {
        await initializeApp();
        res.json({ success: true, db: 'connected', env: process.env.NODE_ENV });
    } catch (e) {
        res.json({ success: true, db: 'error', error: e.message, env_check: !!process.env.DB_HOST });
    }
});

app.get('/health', (req, res) => res.json({ status: 'awake' }));

// Register routes only after DB check
app.use(async (req, res, next) => {
    if (req.path.startsWith('/api/health') || req.path === '/health') return next();
    try {
        await initializeApp();
        next();
    } catch (error) {
        res.status(503).json({ success: false, error: 'Database connection failed' });
    }
});

// Load actual business routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/absensi', require('./routes/absensi'));
app.use('/api/cuti', require('./routes/cuti'));
app.use('/api/koreksi', require('./routes/koreksi'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/users', require('./routes/user'));
app.use('/api/shifts', require('./routes/shift'));
app.use('/api/shift-change', require('./routes/shiftChangeRoutes'));
app.use('/api/jadwal', require('./routes/jadwal'));
app.use('/api/outlets', require('./routes/outlet'));
app.use('/api/notifications', require('./routes/notifications'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
});

if (process.env.VERCEL !== '1') {
    initializeApp().then(() => {
        app.listen(PORT, () => console.log(`✓ Server on ${PORT}`));
    }).catch(e => console.error('Startup failed', e));
}

module.exports = app;
