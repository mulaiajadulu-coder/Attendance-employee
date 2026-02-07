const { User, KoreksiAbsensi } = require('./models');

const checkPending = async () => {
    try {
        const requests = await KoreksiAbsensi.findAll({
            where: { status: 'pending' },
            include: [{ model: User, as: 'user', attributes: ['nama_lengkap', 'nik'] }]
        });

        console.log('--- PENDING REQUESTS ---');
        requests.forEach(r => {
            console.log(`ID: ${r.id} | User: ${r.user.nama_lengkap} (${r.user.nik}) | Tanggal: ${r.tanggal} | Status: ${r.status}`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkPending();
