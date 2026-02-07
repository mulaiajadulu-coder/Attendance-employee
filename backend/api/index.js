
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
    // 1. ALWAYS set CORS headers for every single response
    setCors(req, res);

    // 2. Handle Preflight immediately
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    try {
        // Ping diagnostic
        if (req.url === '/api/ping') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: 'PONG', status: 'ALIVE' }));
            return;
        }

        // Force pg bundle (original comment was removed in the diff, but keeping it for context if it was an oversight)
        try { require('pg'); } catch (e) { }

        // Load App
        const app = require('../src/app');
        return app(req, res);

    } catch (error) {
        console.error('CRITICAL INIT ERROR:', error);

        // Ensure error response also has CORS
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            error: 'SERVER_ERROR',
            message: error.message
        }));
    }
};
