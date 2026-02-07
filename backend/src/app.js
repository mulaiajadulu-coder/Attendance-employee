const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        success: false,
        error: { code: 'TOO_MANY_REQUESTS', message: 'Terlalu banyak permintaan, silakan coba lagi nanti.' }
    }
});
app.use(globalLimiter);

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(o => o.trim().replace(/\/$/, ''))
    : [];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.trim().replace(/\/$/, '');
        const isAllowed = allowedOrigins.includes(normalizedOrigin) ||
            normalizedOrigin === 'http://localhost:5173' ||
            normalizedOrigin.endsWith('.vercel.app'); // Temporarily lax for debugging

        if (isAllowed) {
            callback(null, true);
        } else {
            console.error(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
app.use(express.static(path.join(__dirname, '../public')));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Database Initialization State
let isDbInitialized = false;
let dbInitError = null;

const initializeApp = async () => {
    if (isDbInitialized) return;
    try {
        console.log('Initializing database connection...');
        await testConnection();
        // Skip sync in production serverless if db is already seeded
        // But for free tier/dev, it's safer to keep it for now.
        await syncDatabase();
        isDbInitialized = true;
        console.log('✓ Database initialized successfully');
    } catch (error) {
        dbInitError = error;
        console.error('✗ Database initialization failed:', error);
        throw error;
    }
};

// Middleware to ensure DB is initialized (Serverless safe)
app.use(async (req, res, next) => {
    if (req.path === '/api/health' || req.path === '/health') return next();

    try {
        await initializeApp();
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_INIT_ERROR',
                message: 'Gagal terhubung ke database. Cek konfigurasi env.',
                details: error.message
            }
        });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    let dbStatus = 'waiting';
    try {
        await initializeApp();
        dbStatus = 'connected';
    } catch (e) {
        dbStatus = 'error: ' + e.message;
    }

    res.json({
        success: true,
        message: 'Server is running',
        db_status: dbStatus,
        env: process.env.NODE_ENV,
        frontend_url_config: process.env.FRONTEND_URL,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Server is awake' });
});

// API Routes
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

// Error handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(err.status || 500).json({
        success: false,
        error: {
            code: err.code || 'SERVER_ERROR',
            message: err.message || 'Terjadi kesalahan server'
        }
    });
});

// Initialize server
const startServer = async () => {
    if (process.env.VERCEL === '1') return; // Handled by middleware

    try {
        await initializeApp();

        app.listen(PORT, '0.0.0.0', () => {
            console.log('='.repeat(50));
            console.log(`✓ HTTP Server running on port ${PORT}`);
            console.log(`✓ Local: http://localhost:${PORT}`);
            console.log('='.repeat(50));
        });

        // BACKGROUND JOBS (Non-serverless only)
        // Cleanup deactivates
        setInterval(async () => {
            try {
                const { User } = require('./models');
                const { Op } = require('sequelize');
                const now = new Date();
                await User.destroy({ where: { status_aktif: false, scheduled_deletion_at: { [Op.lte]: now } } });
            } catch (e) { console.error('Cleanup error:', e); }
        }, 5 * 60000);

        // Cleanup notifications/announcements
        setInterval(async () => {
            try {
                const { Notification, Announcement } = require('./models');
                const { Op } = require('sequelize');
                const now = new Date();
                const sevenDaysAgo = new Date(now - (7 * 24 * 60 * 60 * 1000));
                await Notification.destroy({ where: { created_at: { [Op.lt]: sevenDaysAgo } } });
                await Announcement.destroy({ where: { created_at: { [Op.lt]: sevenDaysAgo }, priority: { [Op.ne]: 'urgent' } } });
            } catch (e) { console.error('Cleanup error:', e); }
        }, 60 * 60000);

    } catch (error) {
        console.error('FATAL ERROR DURING STARTUP:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
