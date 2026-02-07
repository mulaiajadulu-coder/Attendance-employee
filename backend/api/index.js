
// Vercel Entry Point - Robust & Dependency-Free Fallback

// Helper to set CORS headers safely (Native)
const setCors = (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
};

try {
    // 1. Force Vercel to bundle pg (might fail if missing)
    try { require('pg'); } catch (e) { console.error('PG Missing:', e.message); }

    // 2. Load Express App
    const app = require('../src/app');

    // 3. Main Handler
    module.exports = (req, res) => {
        // Handle CORS immediately
        setCors(req, res);

        // Handle Preflight
        if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
        }

        try {
            return app(req, res);
        } catch (error) {
            console.error('RUNTIME ERROR:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: 'RUNTIME_CRASH',
                message: error.message
            }));
        }
    };

} catch (startupError) {
    console.error('STARTUP ERROR:', startupError);

    // 4. Fallback Handler (No dependencies allowed here!)
    module.exports = (req, res) => {
        setCors(req, res);

        if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
        }

        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            error: 'CRITICAL_STARTUP_FAILURE',
            message: startupError.message,
            stack: startupError.stack,
            hint: 'Check Vercel Build Logs for missing modules.'
        }));
    };
}
