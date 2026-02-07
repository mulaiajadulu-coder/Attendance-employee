const { User } = require('./models');

const checkUsers = async () => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'nama_lengkap', 'nik', 'role', 'atasan_id']
        });
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
