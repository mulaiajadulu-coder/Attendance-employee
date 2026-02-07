const { Client } = require('pg');
require('dotenv').config();

const checkDb = async () => {
    console.log('Checking database connection...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Port: ${process.env.DB_PORT}`);

    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: 'postgres', // Connect to default db first
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        await client.connect();
        console.log('✓ Successfully connected to PostgreSQL!');

        // Check if expected database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
        if (res.rows.length > 0) {
            console.log(`✓ Database '${process.env.DB_NAME}' exists.`);
        } else {
            console.log(`! Database '${process.env.DB_NAME}' does NOT exist yet.`);
            console.log(`  Run 'npm run seed' (or node src/seeders/run.js) to create it.`);
        }

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error('✗ Connection failed:', err.message);
        if (err.code === '28P01') {
            console.error('  -> Incorrect password in .env file');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('  -> PostgreSQL is not running or port is wrong');
        }
        process.exit(1);
    }
};

checkDb();
