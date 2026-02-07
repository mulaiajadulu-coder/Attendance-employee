
// Vercel Entry Point - Robust & Dependency-Free Fallback

// Helper to set CORS headers safely (Native)
const setCors = (req, res) => {
    const origin = req.headers.origin;
    // Only set if not already set by Vercel infrastructure
    if (!res.getHeader('Access-Control-Allow-Origin')) {
        if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        } else {
            res.setHeader('Access-Control-Allow-Origin', 'https://attendance-employee-app.vercel.app');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, Accept, Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
};

module.exports = async (req, res) => {
    setCors(req, res);

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end('OK');
        return;
    }

    try {
        if (req.url === '/api/ping') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'OK' }));
            return;
        }

        const app = require('../src/app');
        return app(req, res);
    } catch (error) {
        console.error('ERROR:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
    }
};
