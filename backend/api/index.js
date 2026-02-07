// Force Vercel to bundle pg
require('pg');

try {
    const app = require('../src/app');

    // Vercel Entry Point
    module.exports = (req, res) => {
        // NUCLEAR OPTION: Hardcoded CORS at entry point
        res.setHeader('Access-Control-Allow-Origin', '*'); // Allow ALL
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, Accept');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

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
