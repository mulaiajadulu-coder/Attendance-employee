
// Vercel Entry Point - Robust & Dependency-Free Fallback

// Helper to set CORS headers safely (Native)
const setCors = (req, res) => {
    const origin = req.headers.origin;

    // NUCLEAR: Dynamic reflection of origin
    // This fixes the "Wildcard + Credentials" conflict
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, Accept, Origin, Cache-Control, Pragma');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
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
            stack: error.stack,
            env_check: {
                node_env: process.env.NODE_ENV,
                has_db_url: !!process.env.DATABASE_URL,
                has_db_host: !!process.env.DB_HOST
            },
            hint: 'There is a bug in src/app.js or a missing module.'
        }));
    }
};
