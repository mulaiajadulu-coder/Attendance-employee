const models = require('../src/models');
const koreksiController = require('../src/controllers/koreksiController');

(async () => {
    try {
        await models.syncDatabase(false);

        const User = models.User;
        const KoreksiAbsensi = models.KoreksiAbsensi;
        const Absensi = models.Absensi;

        // Ensure test user
        let user = await User.findOne({ where: { email: 'test-emp@example.com' } });
        if (!user) {
            user = await User.create({
                nama_lengkap: 'Test Employee',
                nik: 'TESTEMP',
                email: 'test-emp@example.com',
                password_hash: 'password',
                tanggal_bergabung: new Date().toISOString().slice(0, 10)
            });
            console.log('Created test user', user.id);
        }

        // Ensure approver (admin)
        let admin = await User.findOne({ where: { email: 'test-admin@example.com' } });
        if (!admin) {
            admin = await User.create({
                nama_lengkap: 'Test Admin',
                nik: 'TESTADM',
                email: 'test-admin@example.com',
                password_hash: 'password',
                role: 'admin',
                tanggal_bergabung: new Date().toISOString().slice(0, 10)
            });
            console.log('Created admin user', admin.id);
        }

        // Create a koreksi request for yesterday
        const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
        const tanggal = yesterday.toISOString().slice(0, 10);

        const koreksi = await KoreksiAbsensi.create({
            user_id: user.id,
            tanggal,
            jam_masuk_baru: '08:15',
            jam_pulang_baru: '17:05',
            alasan: 'Testing approval flow',
            status: 'pending'
        });
        console.log('Created koreksi id', koreksi.id);

        // Fake req/res
        const req = { params: { id: koreksi.id }, body: { action: 'approve', catatan: 'OK' }, user: { id: admin.id, nama_lengkap: admin.nama_lengkap, nik: admin.nik } };
        const res = {
            status(code) { this._status = code; return this; },
            json(payload) { console.log('Controller response', this._status || 200, payload); }
        };

        // Call validateRequest
        await koreksiController.validateRequest(req, res);

        // Query Absensi
        const abs = await Absensi.findOne({ where: { user_id: user.id, tanggal } });
        console.log('Absensi after approval:', abs ? abs.toJSON() : null);

        process.exit(0);
    } catch (e) {
        console.error('Test failed', e);
        process.exit(1);
    }
})();
