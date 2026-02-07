
// Vercel Entry Point - Robust & Dependency-Free Fallback

// Helper to set CORS headers safely (Native)
const setCors = (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://attendance-employee-app.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ];

    // Smart origin check
    if (origin && (allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.vercel.app'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
};

module.exports = async (req, res) => {
    // 1. Handle CORS immediately (Before anything else)
    setCors(req, res);

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    // DIAGNOSTIC ROUTE: /api/ping
    // Provides immediate confirmation that the server function is alive and CORS is working.
    if (req.url === '/api/ping') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            message: 'PONG',
            status: 'ALIVE',
            timestamp: new Date().toISOString()
        }));
        return;
    }

    try {
        // 2. Load Modules ONLY when request comes (Lazy Loading)
        // This prevents "Cold Start" crashes from killing the whole function

        // Force pg bundle
        try { require('pg'); } catch (e) { }

        // Load App
        const app = require('../src/app');

        // 3. Hand over to App
        return app(req, res);

    } catch (error) {
        // 4. Catastrophic Error Handler
        console.error('CRITICAL INIT ERROR:', error);

        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');

        res.end(JSON.stringify({
            error: 'CRITICAL_INIT_FAILURE',
            message: error.message,
            stack: error.stack, // Stack trace helps debug
            hint: 'There is a bug in src/app.js or a missing module.'
        }));
    }
};
