const { User, KoreksiAbsensi } = require('./models');

async function check() {
    const users = await User.findAll({ attributes: ['id', 'nik', 'nama_lengkap', 'role'] });
    const koreksi = await KoreksiAbsensi.findAll({ attributes: ['id', 'user_id', 'status', 'tanggal'] });

    console.log('--- USERS ---');
    users.forEach(u => console.log(`${u.id}:${u.nik}:${u.nama_lengkap}:${u.role}`));

    console.log('\n--- KOREKSI ---');
    koreksi.forEach(k => console.log(`ID:${k.id} UID:${k.user_id} Status:${k.status} Date:${k.tanggal}`));
    process.exit(0);
}
check();
