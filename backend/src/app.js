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
const jadwalRoutes = require('./routes/jadwal'); // Added
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
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
        success: false,
        error: { code: 'TOO_MANY_REQUESTS', message: 'Terlalu banyak permintaan, silakan coba lagi nanti.' }
    }
});
app.use(globalLimiter);

// Middleware
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin === 'http://localhost:5173') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const uploadsPath = path.join(__dirname, '../uploads');
console.log('Serving uploads from:', uploadsPath);
app.use('/uploads', (req, res, next) => {
    console.log(`[UPLOADS REQ] ${req.method} ${req.path}`);
    next();
}, express.static(uploadsPath));
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware
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
    if (process.env.VERCEL === '1' && !isDbInitialized) {
        try {
            await initializeApp();
            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { code: 'DATABASE_INIT_ERROR', message: 'Failed to connect to database' }
            });
        }
    } else {
        next();
    }
});

// Health check endpoint (moved under /api for consistency with Vercel routing)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        db_connected: isDbInitialized,
        db_error: dbInitError ? dbInitError.message : null,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
});

// Backward compatibility or alternative health check
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Server is awake' });
});

// API Routes
app.use('/api/auth', authRoutes);
// ... (rest of routes preserved)
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
    console.error('Error:', err);
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
    if (process.env.VERCEL === '1') return; // Handled by middleware on first request

    try {
        await initializeApp();

        // Start HTTP server
        app.listen(PORT, '0.0.0.0', () => {
            console.log('='.repeat(50));
            console.log(`✓ HTTP Server running on port ${PORT}`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✓ Local: http://localhost:${PORT}`);
            console.log('='.repeat(50));
        });

        // BACKGROUND JOBS...
        setInterval(async () => { /* ... existing cleanup logic ... */ }, 5 * 60000);
        setInterval(async () => { /* ... existing cleanup logic ... */ }, 60 * 60000);

    } catch (error) {
        console.error('FATAL ERROR DURING STARTUP:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
