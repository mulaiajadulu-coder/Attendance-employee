const app = require('../src/app');

// Vercel serverless function handler
module.exports = (req, res) => {
    // Add detailed error handling for startup
    try {
        return app(req, res);
    } catch (error) {
        console.error('Vercel Function Crash:', error);
        res.status(500).json({
            error: 'CRITICAL_FUNCTION_CRASH',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
