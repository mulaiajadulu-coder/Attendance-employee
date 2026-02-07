const { syncDatabase, testConnection } = require('./src/models');
require('dotenv').config();

async function run() {
    try {
        await testConnection();
        console.log('Syncing...');
        await syncDatabase();
        console.log('Sync done!');
        process.exit(0);
    } catch (err) {
        console.error('SYNC ERROR:', err);
        process.exit(1);
    }
}
run();
