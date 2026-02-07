require('dotenv').config();
const { KoreksiAbsensi, User } = require('./src/models');
const koreksiController = require('./src/controllers/koreksiController');
const emailService = require('./src/services/emailService');

(async () => {
    try {
        console.log('Running koreksi notification test...');

        // Spy on sendEmail
        let called = false;
        let calledArgs = null;
        const originalSend = emailService.sendEmail;
        emailService.sendEmail = async (to, subject, text, html) => {
            called = true;
            calledArgs = { to, subject, text };
            console.log('*** emailService.sendEmail called:', to, subject);
            return true; // simulate success
        };

        // Use EMP002 as requester
        const emp = await User.findOne({ where: { nik: 'EMP002' } });
        if (!emp) throw new Error('EMP002 not found in DB');

        const req = { user: emp, body: { tanggal: '2026-02-03', jam_masuk_baru: '08:00:00', jam_pulang_baru: '17:00:00', alasan: 'Test notifikasi' } };
        const res = {
            status: (code) => { console.log('Response status:', code); return res; },
            json: (payload) => { console.log('Response json:', JSON.stringify(payload)); }
        };

        await koreksiController.createRequest(req, res);

        // Check DB: latest koreksi for user
        const latest = await KoreksiAbsensi.findOne({ where: { user_id: emp.id }, order: [['created_at', 'DESC']] });
        console.log('Latest koreksi id:', latest ? latest.id : 'none');

        console.log('Email called?', called, calledArgs);

        // Restore
        emailService.sendEmail = originalSend;

        process.exit(0);
    } catch (err) {
        console.error('Test Error:', err);
        process.exit(1);
    }
})();
