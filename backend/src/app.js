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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
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
    try {
        console.log('Starting server initialization...');

        // Test database connection
        await testConnection();

        // Sync database (create tables)
        await syncDatabase();
        console.log('Post-DB sync checkpoint');

        // Ensure SSL certs exist (dev-only)
        if (process.env.NODE_ENV !== 'production') {
            try {
                const certDir = path.join(__dirname, '../certs');
                const keyPath = path.join(certDir, 'key.pem');
                const certPath = path.join(certDir, 'cert.pem');

                if (!fs.existsSync(certDir) || !fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
                    console.log('Certs missing or incomplete, attempting to generate (dev-only)...');
                    try {
                        // run generate-cert.js which uses openssl; catch errors to avoid crashing server
                        require('../generate-cert');
                        console.log('Cert generation script executed (check output above)');
                    } catch (e) {
                        console.error('Certificate generation script failed:', e && e.message ? e.message : e);
                        // Fallback: try generating using selfsigned package (pure JS)
                        try {
                            const selfsigned = require('selfsigned');
                            const attrs = [{ name: 'commonName', value: 'localhost' }];
                            const pems = selfsigned.generate(attrs, { days: 365 });
                            if (pems && typeof pems.private === 'string' && typeof pems.cert === 'string') {
                                fs.writeFileSync(keyPath, pems.private);
                                fs.writeFileSync(certPath, pems.cert);
                                console.log('Fallback: selfsigned certs generated and written to disk');
                            } else {
                                console.error('Fallback selfsigned returned invalid cert data');
                            }
                        } catch (e2) {
                            console.error('Fallback selfsigned generation failed (non-fatal):', e2 && e2.message ? e2.message : e2);
                        }
                    }
                } else {
                    console.log('Certs present, skipping generation');
                }
            } catch (e) {
                console.error('Cert check error:', e.message);
            }
        }

        console.log('Starting HTTP server...');
        // Only listen if not running as a serverless function (e.g. on Vercel)
        if (process.env.VERCEL !== '1') {
            // Start HTTP server
            app.listen(PORT, '0.0.0.0', () => {
                console.log('='.repeat(50));
                console.log(`✓ HTTP Server running on port ${PORT}`);
                console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log(`✓ Local: http://localhost:${PORT}`);
                console.log(`✓ Network: http://192.168.18.15:${PORT}`);
                console.log('='.repeat(50));
            });
        }


        // ---------------------------------------------------------
        // BACKGROUND JOB: CLEANUP DEACTIVATED USERS (30 MINUTES)
        // Note: On Vercel (serverless), setInterval won't work reliably.
        // For production, these should be Cron Jobs.
        // ---------------------------------------------------------
        if (process.env.VERCEL !== '1') {
            setInterval(async () => {
                try {
                    const { User } = require('./models');
                    const { Op } = require('sequelize');
                    const now = new Date();

                    const deletedCount = await User.destroy({
                        where: {
                            status_aktif: false,
                            scheduled_deletion_at: { [Op.lte]: now }
                        }
                    });

                    if (deletedCount > 0) {
                        console.log(`🗑️ [CLEANUP] Deleted ${deletedCount} users permanently after deactivation period.`);
                    }
                } catch (cleanupErr) {
                    console.error('❌ [CLEANUP ERROR]:', cleanupErr.message);
                }
            }, 5 * 60000); // Check every 5 minutes
        }


        // ---------------------------------------------------------
        // BACKGROUND JOB: CLEANUP OLD NOTIFICATIONS & ANNOUNCEMENTS (EVERY 1 HOUR)
        // Note: On Vercel (serverless), setInterval won't work reliably.
        // For production, these should be Cron Jobs.
        // ---------------------------------------------------------
        if (process.env.VERCEL !== '1') {
            setInterval(async () => {
                try {
                    const { Notification, Announcement } = require('./models');
                    const { Op } = require('sequelize');
                    const now = new Date();

                    // 1. Delete Notifications older than 7 days
                    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                    const deletedNotif = await Notification.destroy({
                        where: { created_at: { [Op.lt]: sevenDaysAgo } }
                    });

                    // 2. Delete Announcements
                    // Priority Urgent: older than 15 days
                    // Others: older than 7 days
                    const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));

                    const deletedUrgent = await Announcement.destroy({
                        where: {
                            priority: 'urgent',
                            created_at: { [Op.lt]: fifteenDaysAgo }
                        }
                    });

                    const deletedNormal = await Announcement.destroy({
                        where: {
                            priority: { [Op.ne]: 'urgent' },
                            created_at: { [Op.lt]: sevenDaysAgo }
                        }
                    });

                    if (deletedNotif > 0 || deletedUrgent > 0 || deletedNormal > 0) {
                        console.log(`🧹 [CLEANUP] Deleted: ${deletedNotif} notifs, ${deletedUrgent} urgent ann, ${deletedNormal} normal ann.`);
                    }
                } catch (err) {
                    console.error('🧹 [CLEANUP ERROR]:', err.message);
                }
            }, 60 * 60000); // Check every 1 hour
        }

    } catch (error) {
        console.error('FATAL ERROR DURING STARTUP:', error);
        if (process.env.VERCEL !== '1') process.exit(1);
    }
};

startServer();

module.exports = app;