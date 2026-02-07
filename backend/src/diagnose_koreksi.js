const { KoreksiAbsensi, User, sequelize } = require('./models');

const diagnose = async () => {
    try {
        const users = await User.findAll({ attributes: ['id', 'nama_lengkap', 'role', 'nik'] });
        console.log('--- USERS ---');
        users.forEach(u => console.log(`[${u.id}] ${u.nama_lengkap} (${u.role})`));

        const requests = await KoreksiAbsensi.findAll();
        console.log('\n--- REQUESTS ---');
        requests.forEach(r => console.log(`[ID:${r.id}] User:${r.user_id} Status:${r.status} Date:${r.tanggal}`));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

diagnose();
