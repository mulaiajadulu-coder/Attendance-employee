const { User, Absensi, KoreksiAbsensi } = require('./models');
const { Op } = require('sequelize');

const checkData = async () => {
    try {
        console.log('--- USER DATA ---');
        const users = await User.findAll({
            where: { nik: ['EMP001', 'EMP002', 'MGR001'] },
            attributes: ['id', 'nik', 'nama_lengkap', 'role']
        });
        console.log(JSON.stringify(users, null, 2));

        console.log('\n--- ABSENSI DATA (FEB 1-2) ---');
        const absensi = await Absensi.findAll({
            where: {
                tanggal: { [Op.between]: ['2026-02-01', '2026-02-02'] }
            }
        });
        console.log(JSON.stringify(absensi, null, 2));

        console.log('\n--- KOREKSI DATA (PENDING) ---');
        const koreksi = await KoreksiAbsensi.findAll({
            where: { status: 'pending' },
            include: [{ model: User, as: 'user', attributes: ['nama_lengkap', 'nik'] }]
        });
        console.log(JSON.stringify(koreksi, null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkData();
