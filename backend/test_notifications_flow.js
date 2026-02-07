require('dotenv').config();
const { User, Notification, KoreksiAbsensi } = require('./src/models');

(async ()=>{
    try {
        console.log('Testing in-app notifications flow...');

        // Create koreksi request as EMP002 (reuse controller previously tested)
        const emp = await User.findOne({ where: { nik: 'EMP002' } });
        if (!emp) throw new Error('EMP002 missing');

        const spv = await User.findOne({ where: { nik: 'SPV002' } });
        if (!spv) throw new Error('SPV002 missing');

        // Create a koreksi record to simulate
        const koreksi = await KoreksiAbsensi.create({ user_id: emp.id, tanggal: '2026-02-04', jam_masuk_baru: '09:00:00', jam_pulang_baru: '18:00:00', alasan: 'Test flow', status: 'pending' });
        console.log('Created koreksi id:', koreksi.id);

        // Create notification for SPV
        const notif = await Notification.create({ user_id: spv.id, actor_id: emp.id, type: 'koreksi_request', title: `Pengajuan Koreksi: ${emp.nama_lengkap}`, message: `Koreksi oleh ${emp.nama_lengkap} tanggal ${koreksi.tanggal}`, data: { koreksi_id: koreksi.id } });
        console.log('Notification created id:', notif.id);

        // Fetch notifications for SPV
        const items = await Notification.findAll({ where: { user_id: spv.id }, order: [['created_at', 'DESC']] });
        console.log('SPV Notifications count:', items.length);
        console.log(items.map(i=> ({ id: i.id, title: i.title, read: i.read, data: i.data })));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();