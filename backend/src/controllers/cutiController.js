const { Cuti, User, Absensi, Jadwal, Shift, sequelize } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Helper: Save Base64 File
const saveBase64File = (base64String, subDir = 'cuti') => {
    if (!base64String || !base64String.startsWith('data:')) return base64String;
    try {
        const isVercel = process.env.VERCEL === '1';
        const rootDir = isVercel ? '/tmp' : path.join(__dirname, '../../uploads');
        const uploadDir = path.join(rootDir, subDir);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return null;

        const mimeType = matches[1];
        const base64Data = matches[2];
        const extension = mimeType.split('/')[1] || 'bin';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, base64Data, 'base64');
        return isVercel ? `tmp/${subDir}/${fileName}` : `uploads/${subDir}/${fileName}`;
    } catch (error) {
        console.error('Save File Error:', error);
        return null;
    }
};

// Ajukan Cuti
exports.applyCuti = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { tipe_cuti, tanggal_mulai, tanggal_selesai, alasan, bukti_url } = req.body;
        const userId = req.user.id;

        // Hitung jumlah hari
        const start = new Date(tanggal_mulai);
        const end = new Date(tanggal_selesai);

        // Validasi: Tidak boleh mundur tanggal (Past Date)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

        const compareStart = new Date(start);
        compareStart.setHours(0, 0, 0, 0);

        if (compareStart < today) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { message: 'Tanggal pengajuan tidak boleh tanggal yang sudah lewat (Backdate)' }
            });
        }

        const diffTime = Math.abs(end - start);
        const jumlah_hari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (jumlah_hari < 1) {
            await t.rollback();
            return res.status(400).json({ success: false, error: { message: 'Tanggal selesai harus setelah tanggal mulai' } });
        }

        // Cek kuota cuti tahunan jika tipe_cuti = 'Tahunan'
        const user = await User.findByPk(userId);
        if (tipe_cuti === 'Tahunan') {
            if (user.sisa_cuti < jumlah_hari) {
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    error: { message: `Kuota cuti tidak mencukupi. Sisa kuota: ${user.sisa_cuti} hari, Pengajuan: ${jumlah_hari} hari.` }
                });
            }
        }

        const savedBuktiUrl = bukti_url ? saveBase64File(bukti_url) : null;

        const newCuti = await Cuti.create({
            user_id: userId,
            tipe_cuti,
            tanggal_mulai,
            tanggal_selesai,
            jumlah_hari,
            alasan,
            bukti_url: savedBuktiUrl,
            status: 'pending' // Default pending
        }, { transaction: t });

        // NOTIFICATION: Notify supervisor
        try {
            const { Notification } = require('../models');
            const atasanId = req.user.atasan_id || (req.user.atasan ? req.user.atasan.id : null);

            if (atasanId) {
                await Notification.create({
                    user_id: atasanId,
                    actor_id: userId,
                    type: 'cuti_request',
                    title: `Pengajuan Cuti: ${req.user.nama_lengkap}`,
                    message: `${req.user.nama_lengkap} (NIK: ${req.user.nik}) mengajukan ${tipe_cuti} untuk tanggal ${tanggal_mulai} s/d ${tanggal_selesai}.`,
                    data: { cuti_id: newCuti.id },
                    read: false
                }, { transaction: t });
            } else {
                // Fallback to HR
                const hrUser = await User.findOne({ where: { role: 'hr' }, attributes: ['id'] });
                if (hrUser) {
                    await Notification.create({
                        user_id: hrUser.id,
                        actor_id: userId,
                        type: 'cuti_request',
                        title: `Pengajuan Cuti: ${req.user.nama_lengkap}`,
                        message: `${req.user.nama_lengkap} (NIK: ${req.user.nik}) mengajukan ${tipe_cuti} untuk tanggal ${tanggal_mulai} s/d ${tanggal_selesai}.`,
                        data: { cuti_id: newCuti.id },
                        read: false
                    }, { transaction: t });
                }
            }
        } catch (notifErr) {
            console.error('[Cuti] Notification error:', notifErr);
            // non-blocking
        }

        await t.commit();

        res.status(201).json({
            success: true,
            message: 'Pengajuan cuti berhasil dikirim',
            data: newCuti
        });
    } catch (error) {
        await t.rollback();
        console.error('Apply Cuti Error:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

// History Cuti Saya
exports.getMyHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const cutiList = await Cuti.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });

        res.json({ success: true, data: cutiList });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

// Approval List (Untuk Atasan/HR)
exports.getApprovalList = async (req, res) => {
    try {
        const isHR = req.user.role === 'hr' || req.user.role === 'admin';

        const approvals = await Cuti.findAll({
            where: { status: 'pending' },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'nama_lengkap', 'nik', 'departemen_id'],
                    where: isHR ? {} : { atasan_id: req.user.id }
                }
            ],
            order: [['created_at', 'ASC']]
        });

        res.json({ success: true, data: approvals });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

// Helper to check if a user is a subordinate of a manager
const isSubordinate = async (managerId, subordinateId) => {
    const visited = new Set();
    const stack = [managerId];
    while (stack.length) {
        const mid = stack.pop();
        if (visited.has(String(mid))) continue;
        visited.add(String(mid));
        const subs = await User.findAll({ where: { atasan_id: mid }, attributes: ['id'], raw: true });
        for (const s of subs) {
            if (String(s.id) === String(subordinateId)) return true;
            stack.push(s.id);
        }
    }
    return false;
};

// Action Approve/Reject
exports.validateCuti = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { action, catatan } = req.body; // action: 'approve' | 'reject'

        if (!['approve', 'reject'].includes(action)) {
            await t.rollback();
            return res.status(400).json({ success: false, error: { message: 'Invalid action' } });
        }

        const cuti = await Cuti.findByPk(id, { include: ['user'] });
        if (!cuti) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { message: 'Data cuti tidak ditemukan' } });
        }

        if (cuti.status !== 'pending') {
            await t.rollback();
            return res.status(400).json({ success: false, error: { message: 'Pengajuan sudah diproses' } });
        }

        // Authorization Check (IDOR Prevention)
        const isHR = ['hr', 'admin'].includes(req.user.role);
        const isDirectSuperior = String(cuti.user.atasan_id) === String(req.user.id);

        if (!isHR && !isDirectSuperior) {
            const isIndirectSuperior = await isSubordinate(req.user.id, cuti.user_id);
            if (!isIndirectSuperior) {
                await t.rollback();
                return res.status(403).json({ success: false, error: { message: 'Anda tidak memiliki akses untuk menyetujui pengajuan ini' } });
            }
        }

        cuti.status = action === 'approve' ? 'approved' : 'rejected';
        cuti.approved_by = req.user.id;
        cuti.approved_at = new Date();
        cuti.catatan_approval = catatan;

        await cuti.save({ transaction: t });

        // Add Notification for User
        await Notification.create({
            user_id: cuti.user_id,
            actor_id: req.user.id,
            type: 'cuti_status',
            title: `Pengajuan Cuti ${action === 'approve' ? 'Disetujui' : 'Ditolak'}`,
            message: `Catatan: ${catatan || '-'}`,
            data: { cuti_id: cuti.id, status: cuti.status },
            read: false
        }, { transaction: t });

        // Kurangi jatah cuti jika disetujui dan tipenya Tahunan
        if (action === 'approve' && cuti.tipe_cuti === 'Tahunan') {
            const user = await User.findByPk(cuti.user_id);
            user.sisa_cuti = Math.max(0, user.sisa_cuti - cuti.jumlah_hari);
            await user.save({ transaction: t });
        }

        // Generate 'Absensi' records for local system
        if (action === 'approve') {
            const start = new Date(cuti.tanggal_mulai);
            const end = new Date(cuti.tanggal_selesai);
            const user = await User.findByPk(cuti.user_id);

            // Loop through dates
            let curr = new Date(start);
            while (curr <= end) {
                const dateStr = curr.toLocaleDateString('en-CA');

                // Pick scheduled shift if exists, otherwise use default
                const scheduled = await Jadwal.findOne({
                    where: { user_id: cuti.user_id, tanggal: dateStr }
                });

                const tipe = cuti.tipe_cuti?.toLowerCase();
                let statusHadir = 'cuti';
                let notes = `${cuti.tipe_cuti}: ${cuti.alasan}`;

                if (tipe === 'sakit') {
                    if (cuti.bukti_url) {
                        statusHadir = 'Sakit';
                        notes = 'sakit dengan surat dokter';
                    } else {
                        statusHadir = 'Sakit TPS';
                        notes = 'Sakit tanpa surat dokter';
                    }
                } else if (tipe === 'off') {
                    statusHadir = 'libur';
                    notes = 'OFF';
                } else if (tipe === 'izin' || tipe === 'penting') {
                    statusHadir = 'izin';
                }

                // Create or update record
                await Absensi.upsert({
                    user_id: cuti.user_id,
                    tanggal: dateStr,
                    status_hadir: statusHadir,
                    shift_id: scheduled?.shift_id || user.shift_default_id || 1,
                    is_locked: true,
                    catatan: notes
                }, { transaction: t });

                curr.setDate(curr.getDate() + 1);
            }
        }

        await t.commit();

        res.json({
            success: true,
            message: `Pengajuan cuti berhasil di-${action}`,
            data: cuti
        });

    } catch (error) {
        await t.rollback();
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};
