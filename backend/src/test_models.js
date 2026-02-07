require('dotenv').config();
const { sequelize } = require('./models');

console.log('Testing model import...');
console.log('DB Host:', process.env.DB_HOST);

try {
    const models = require('./models');
    console.log('Models loaded:', Object.keys(models));
} catch (e) {
    console.error('Error loading models:', e);
}
