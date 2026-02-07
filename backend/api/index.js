// EMERGENCY DEBUG PROBE
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const diagnostic = {
        status: 'alive',
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            has_DB_HOST: !!process.env.DB_HOST,
            has_DB_USER: !!process.env.DB_USER,
            has_JWT_SECRET: !!process.env.JWT_SECRET
        },
        file_system: {
            dirname: __dirname,
            app_path: path.join(__dirname, '../src/app.js'),
            app_exists: fs.existsSync(path.join(__dirname, '../src/app.js')),
            node_modules_exists: fs.existsSync(path.join(__dirname, '../node_modules'))
        },
        load_test: {}
    };

    try {
        // Attempt 1: Load Database Config
        try {
            const dbConfig = require('../src/config/database');
            diagnostic.load_test.database_config = 'SUCCESS';
        } catch (e) {
            diagnostic.load_test.database_config = `FAILED: ${e.message}`;
        }

        // Attempt 2: Load Models
        try {
            const models = require('../src/models');
            diagnostic.load_test.models = 'SUCCESS';
        } catch (e) {
            diagnostic.load_test.models = `FAILED: ${e.message}`;
        }

        // Attempt 3: Load App (The Big One)
        try {
            const app = require('../src/app');
            diagnostic.load_test.app = 'SUCCESS';
        } catch (e) {
            diagnostic.load_test.app = `FAILED: ${e.message}`;
            diagnostic.load_test.app_stack = e.stack;
        }

        // If 'load_test.app' was successful, we can actually serve the request!
        // But for this debug step, let's just return the diagnostic JSON 
        // to confirm EXACTLY what is breaking.
        // Once we know, we fix it, then remove this probe.

        res.status(200).json(diagnostic);

    } catch (globalError) {
        res.status(500).json({
            critical_error: globalError.message,
            stack: globalError.stack,
            partial_diagnostic: diagnostic
        });
    }
};
