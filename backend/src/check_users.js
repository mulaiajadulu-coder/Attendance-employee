const { User } = require('./models');

const checkUsers = async () => {
    try {
        const count = await User.count();
        console.log(`Total Users: ${count}`);

        if (count > 0) {
            const users = await User.findAll({ attributes: ['nik', 'nama_lengkap', 'role'] });
            console.table(users.map(u => u.toJSON()));
        } else {
            console.log('⚠️  NO USERS FOUND! Database might be empty.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error checking users:', err);
        process.exit(1);
    }
};

checkUsers();
