const { User, sequelize } = require('./src/models');
const bcrypt = require('bcryptjs');

async function createNewHRManager() {
    try {
        console.log('Creating NEW HR Manager...');

        // Define the new HR Manager data
        const newHRManager = {
            nama_lengkap: 'SUPER HR MANAGER',
            nik: 'HRM999',
            email: 'hr.manager@company.com',
            password_hash: 'admin123', // Will be hashed via hook if using create, but we might user manual hash if using bulkCreate. Let's use create.
            role: 'hr', // 'hr' is the global HR/Manager role based on previous context
            jabatan: 'HR Manager',
            penempatan_store: 'Head Office',
            tanggal_bergabung: new Date(),
            status_aktif: true
        };

        // Check if exists
        const existing = await User.findOne({ where: { nik: newHRManager.nik } });
        if (existing) {
            console.log('User HRM999 already exists. Updating role to hr...');
            existing.role = 'hr';
            await existing.save();
            console.log('Updated existing HRM999 to role: hr');
            return;
        }

        const user = await User.create(newHRManager);
        console.log('Successfully created NEW HR Manager:');
        console.log(`ID: ${user.id}`);
        console.log(`NIK: ${user.nik}`);
        console.log(`Email: ${user.email}`);
        console.log(`Password: admin123`);

    } catch (error) {
        console.error('Error creating HR Manager:', error);
    }
}

createNewHRManager();
