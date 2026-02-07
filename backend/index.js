try {
    const app = require('./src/app');
    module.exports = app;
} catch (error) {
    console.error('CRITICAL STARTUP ERROR:', error);
    // Fallback app to report error directly to browser
    const express = require('express');
    const fallbackApp = express();
    fallbackApp.all('*', (req, res) => {
        res.status(500).json({
            error: 'CRITICAL_STARTUP_ERROR',
            message: error.message,
            stack: error.stack,
            env: process.env.NODE_ENV
        });
    });
    module.exports = fallbackApp;
}
