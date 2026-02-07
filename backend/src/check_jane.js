const { User, KoreksiAbsensi } = require('./models');

async function checkJane() {
    const jane = await User.findOne({ where: { nik: 'EMP002' } });
    if (!jane) {
        console.log('Jane not found');
    } else {
        console.log(`Jane ID: ${jane.id}, Role: ${jane.role}`);
        const koreksi = await KoreksiAbsensi.findAll({ where: { user_id: jane.id } });
        console.log(`Koreksi count for Jane: ${koreksi.length}`);
        koreksi.forEach(k => console.log(`ID:${k.id} Status:${k.status} Date:${k.tanggal}`));
    }
    process.exit(0);
}
checkJane();
