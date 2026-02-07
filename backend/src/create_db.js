const { Client } = require('pg');
require('dotenv').config();

const createDatabase = async () => {
    const dbName = process.env.DB_NAME || 'employee_attendance';

    console.log(`Attempting to create database: ${dbName}...`);

    // Connect to default 'postgres' database first to create new db
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: 'postgres',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        await client.connect();

        // Check if database exists
        const checkRes = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);

        if (checkRes.rows.length === 0) {
            // Create database
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✓ Database '${dbName}' created successfully!`);
        } else {
            console.log(`✓ Database '${dbName}' already exists.`);
        }

        await client.end();
    } catch (err) {
        console.error('✗ Failed to create database:', err.message);
        process.exit(1);
    }
};

createDatabase();
