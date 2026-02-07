const { User, Absensi } = require('./models');
const { Op } = require('sequelize');

const checkAbsensi = async () => {
    try {
        const user = await User.findOne({ where: { nama_lengkap: 'John Doe' } });
        if (!user) { console.log('User Not Found'); return; }

        const records = await Absensi.findAll({
            where: {
                user_id: user.id,
                tanggal: {
                    [Op.gte]: '2026-01-30' // Cek dari akhir Januari
                }
            },
            order: [['tanggal', 'DESC']]
        });

        console.log(JSON.stringify(records.map(r => ({
            tanggal: r.tanggal,
            status: r.status_hadir,
            jam_masuk: r.jam_masuk
        })), null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAbsensi();
