
try {
    // Force Vercel to bundle pg
    require('pg');

    // Attempt to load the app
    const app = require('../src/app');

    // Vercel Entry Point
    module.exports = (req, res) => {
        // Vercel Entry Point
        module.exports = (req, res) => {
            // CORS HEADERS (Fixed: No Wildcard with Credentials)
            const origin = req.headers.origin;
            if (origin) {
                res.setHeader('Access-Control-Allow-Origin', origin);
            } else {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }

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
                    message: error.message,
                    stack: error.stack
                });
            }
        };
    } catch (error) {
        console.error('CRITICAL STARTUP CRASH:', error);

        // Fallback handler if app fails to load (e.g. DB connection, missing modules)
        const express = require('express');
        const fallbackApp = express();
        fallbackApp.all('*', (req, res) => {
            // Essential CORS for Fallback
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');

            if (req.method === 'OPTIONS') return res.status(200).end();

            res.status(500).json({
                error: 'CRITICAL_STARTUP_CRASH',
                message: error.message,
                stack: error.stack,
                hint: 'Dependencies might be missing. Checked: pg. Check logs for more info.'
            });
        });
        module.exports = fallbackApp;
    }
