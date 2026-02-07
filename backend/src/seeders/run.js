require('dotenv').config();
const { testConnection, syncDatabase } = require('../models');
const seedData = require('./seed');

const runSeeder = async () => {
    try {
        console.log('Connecting to database...');
        await testConnection();

        console.log('\nSynchronizing database (this will drop all tables)...');
        await syncDatabase(true); // force: true will drop and recreate tables

        console.log('\nSeeding data...');
        await seedData();

        console.log('\n✓ All done!');
        process.exit(0);
    } catch (error) {
        console.error('Seeder failed:', error);
        process.exit(1);
    }
};

runSeeder();
