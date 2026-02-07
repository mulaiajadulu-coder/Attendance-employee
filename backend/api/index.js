// Force Vercel to bundle pg
require('pg');

try {
    const app = require('../src/app');

    // Vercel Entry Point
    module.exports = (req, res) => {
        try {
            return app(req, res);
        } catch (error) {
            console.error('RUNTIME CRASH:', error);
            res.status(500).json({
                error: 'RUNTIME_CRASH',
                message: error.message
            });
        }
    };
} catch (error) {
    console.error('CRITICAL STARTUP CRASH:', error);

    // Fallback handler if app fails to load (e.g. DB connection, missing modules)
    const express = require('express');
    const fallbackApp = express();
    fallbackApp.all('*', (req, res) => {
        res.status(500).json({
            error: 'CRITICAL_STARTUP_CRASH',
            message: error.message,
            stack: error.stack,
            hint: 'Dependencies might be missing. Checked: pg'
        });
    });
    module.exports = fallbackApp;
}
