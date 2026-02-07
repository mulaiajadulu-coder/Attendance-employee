const { KoreksiAbsensi, Absensi, User, Jadwal, Shift, sequelize } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');

exports.createRequest = async (req, res) => {
    try {
        const { tanggal, jam_masuk_baru, jam_pulang_baru, alasan } = req.body;
        const userId = req.user.id;

        console.log(`[CreateRequest] User ${userId} submitting for ${tanggal}`);

        const request = await KoreksiAbsensi.create({
            user_id: userId,
            tanggal,
            jam_masuk_baru,
            jam_pulang_baru,
            alasan,
            status: 'pending'
        });

        // Notification: Notify approver (atasan) via email and in-app Notification record. Fallback to HR if no direct approver set.
        try {
            let approver = null;
            if (req.user && req.user.atasan_id) {
                approver = await User.findByPk(req.user.atasan_id);
            }

            if (!approver) {
                approver = await User.findOne({ where: { role: 'hr' } });
            }

            if (approver) {
                // Create in-app notification
                const notif = await require('../models').Notification.create({
                    user_id: approver.id,
                    actor_id: req.user.id,
                    type: 'koreksi_request',
                    title: `Pengajuan Koreksi Absensi dari ${req.user.nama_lengkap}`,
                    message: `${req.user.nama_lengkap} (NIK: ${req.user.nik}) mengajukan koreksi untuk tanggal ${tanggal}`,
                    data: { koreksi_id: request.id }
                });
                console.log(`[CreateRequest] Notification created id: ${notif.id}`);

                if (approver.email) {
                    const subject = `Pengajuan Koreksi Absensi dari ${req.user.nama_lengkap}`;
                    const text = `Halo ${approver.nama_lengkap || approver.nik || 'Atasan'},\n\n` +
                        `${req.user.nama_lengkap} (NIK: ${req.user.nik}) mengajukan koreksi absensi untuk tanggal ${tanggal}.\n\n` +
                        `Jam Masuk (baru): ${jam_masuk_baru || '-'}\n` +
                        `Jam Pulang (baru): ${jam_pulang_baru || '-'}\n` +
                        `Alasan: ${alasan || '-'}\n\n` +
                        `Silakan cek halaman Persetujuan di aplikasi untuk memproses pengajuan ini.`;

                    const sent = await emailService.sendEmail(approver.email, subject, text);
                    console.log(`[CreateRequest] Notified approver ${approver.email}: ${sent}`);
                }
            } else {
                console.log('[CreateRequest] No approver found to notify.');
            }
        } catch (err) {
            console.error('[CreateRequest] Notification error:', err);
        }

        res.status(201).json({ message: 'Success', data: request });
    } catch (error) {
        console.error('Error creating correction:', error);
        res.status(500).json({ error: { message: 'Server Error' } });
    }
};

exports.getApprovals = async (req, res) => {
    try {
        console.log(`[GetApprovals] User ${req.user.id} fetching approvals`);

        // DEBUG LEVEL: RETURN ALL PENDING REQUESTS WITHOUT ANY USER FILTER
        // This confirms if reading from DB works at all.
        // Only return requests from subordinates (for supervisors/managers)
        const userFilter = { status: 'pending' };

        // If requester is not HR/Admin, filter to subordinates only
        if (!['hr', 'admin', 'hr_cabang', 'general_manager', 'area_manager'].includes(req.user.role)) {
            // Simple filter: user's atasan_id should equal approver id
            // For completeness we can extend to recursive, but start simple
            userFilter['$user.atasan_id$'] = req.user.id;
        }

        const requests = await KoreksiAbsensi.findAll({
            where: userFilter,
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'nama_lengkap', 'nik', 'atasan_id']
            }],
            order: [['created_at', 'DESC']]
        });

        console.log(`[GetApprovals] Found ${requests.length} requests`);
        if (requests.length > 0) {
            console.log('Request IDs:', requests.map(r => r.id));
            console.log('User IDs in requests:', requests.map(r => r.user_id));
        }

        // Debugging: Jika kosong, coba fetch tanpa filter status
        if (requests.length === 0) {
            const allReq = await KoreksiAbsensi.count();
            console.log(`[GetApprovals] Total requests in DB (any status): ${allReq}`);
        }

        res.json({ data: requests });
    } catch (error) {
        console.error('Error fetching approvals:', error);
        // Return 200 with empty array fallback if error allows, or 500
        res.status(500).json({ error: { message: error.message || 'Server Error' } });
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

exports.validateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, catatan } = req.body;
        const approverId = req.user.id;
        const approverRole = req.user.role;

        const request = await KoreksiAbsensi.findByPk(id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'atasan_id'] }]
        });

        if (!request) return res.status(404).json({ error: { message: 'Pengajuan tidak ditemukan' } });
        if (request.status !== 'pending') return res.status(400).json({ error: { message: 'Pengajuan sudah diproses' } });

        // Authorization Check (IDOR Prevention)
        const isHR = ['hr', 'admin', 'hr_cabang'].includes(approverRole);
        const isDirectSuperior = String(request.user.atasan_id) === String(approverId);

        if (!isHR && !isDirectSuperior) {
            // If not direct, check deeper hierarchy
            const isIndirectSuperior = await isSubordinate(approverId, request.user_id);
            if (!isIndirectSuperior) {
                return res.status(403).json({
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki wewenang untuk menyetujui pengajuan ini' }
                });
            }
        }

        if (action === 'reject') {
            await request.update({ status: 'rejected', approved_by: approverId, catatan_approval: catatan });

            // Add Notification for User
            const { Notification } = require('../models');
            await Notification.create({
                user_id: request.user_id,
                actor_id: approverId,
                type: 'koreksi_rejected',
                title: 'Koreksi Absensi Ditolak',
                message: `Pengajuan koreksi Anda untuk tanggal ${request.tanggal} ditolak. Catatan: ${catatan || '-'}`,
                data: { koreksi_id: request.id },
                read: false
            });

            return res.json({ message: 'Rejected' });
        }

        if (action === 'approve') {
            const t = await sequelize.transaction();
            try {
                // Update correction request status
                await request.update({
                    status: 'approved',
                    approved_by: approverId,
                    catatan_approval: catatan
                }, { transaction: t });

                const tanggal = request.tanggal;
                const jamMasukRaw = request.jam_masuk_baru;
                const jamPulangRaw = request.jam_pulang_baru;

                // 1. Determine Shift for that day FIRST (Required for mandatory shift_id)
                let shift = null;
                const jadwal = await Jadwal.findOne({
                    where: { user_id: request.user_id, tanggal: tanggal },
                    include: [{ model: Shift, as: 'shift' }]
                });

                if (jadwal && jadwal.shift) {
                    shift = jadwal.shift;
                } else {
                    const user = await User.findByPk(request.user_id, {
                        include: [{ association: 'shift_default' }]
                    });
                    shift = user?.shift_default;
                }

                // Safety fallback for shift_id
                const shiftId = shift ? shift.id : 1;

                // 2. Prepare Updates
                const updates = {
                    status_hadir: 'hadir',
                    catatan: `Koreksi: ${request.alasan}`,
                    shift_id: shiftId,
                    is_locked: false // Ensure it's not permanently locked after correction
                };

                if (jamMasukRaw) {
                    // Normalize date-time string
                    updates.jam_masuk = new Date(`${tanggal}T${jamMasukRaw}`);
                }
                if (jamPulangRaw) {
                    updates.jam_pulang = new Date(`${tanggal}T${jamPulangRaw}`);
                }

                // Calculate lateness and total hours
                if (updates.jam_masuk && updates.jam_pulang) {
                    const diffMs = Math.abs(new Date(updates.jam_pulang) - new Date(updates.jam_masuk));
                    updates.total_jam_kerja = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
                }

                if (updates.jam_masuk && shift) {
                    const shiftStart = new Date(`${tanggal}T${shift.jam_masuk}`);
                    const tolerance = shift.toleransi_menit || 0;
                    const menitTerlambat = Math.max(0, Math.round((new Date(updates.jam_masuk) - shiftStart) / 60000));
                    updates.status_terlambat = menitTerlambat > 0;
                    updates.menit_terlambat = menitTerlambat;
                }

                // 3. Sync to Absensi (Upsert using findOrCreate + Update)
                let [absensi, created] = await Absensi.findOrCreate({
                    where: { user_id: request.user_id, tanggal: tanggal },
                    defaults: {
                        shift_id: shiftId,
                        status_hadir: 'hadir'
                    },
                    transaction: t
                });

                await absensi.update(updates, { transaction: t });
                await t.commit();

                // 4. In-App Notification (Non-blocking)
                try {
                    const requester = await User.findByPk(request.user_id);
                    if (requester) {
                        const Notification = require('./Notification') || require('../models').Notification;
                        await Notification.create({
                            user_id: requester.id,
                            actor_id: approverId,
                            type: 'koreksi_approved',
                            title: 'Koreksi Absensi Disetujui',
                            message: `Pengajuan koreksi Anda untuk tanggal ${tanggal} telah disetujui.`,
                            data: { koreksi_id: request.id }
                        });

                        if (requester.email) {
                            await emailService.sendEmail(
                                requester.email,
                                'Koreksi Absensi Disetujui',
                                `Halo ${requester.nama_lengkap},\n\nPengajuan koreksi absensi Anda untuk tanggal ${tanggal} telah disetujui oleh atasan.`
                            );
                        }
                    }
                } catch (e) {
                    console.error('[KoreksiController] Post-commit notification failed:', e);
                }

                return res.json({ success: true, message: 'Approved' });

            } catch (err) {
                await t.rollback();
                console.error('[KoreksiController] Approval Transaction Failed:', err);
                return res.status(500).json({ success: false, error: { message: err.message } });
            }
        }
    } catch (error) {
        console.error('Validate Error:', error);
        res.status(500).json({ error: { message: 'Server Error' } });
    }
};

exports.getMyRequests = async (req, res) => {
    try {
        // Ambil semua request user, urutkan DESC
        const requests = await KoreksiAbsensi.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            include: [{ model: User, as: 'user', attributes: ['id', 'nama_lengkap', 'nik'] }]
        });

        // Group by tanggal, ambil yang status 'pending' jika ada, jika tidak ambil terbaru
        const grouped = {};
        for (const req of requests) {
            const tgl = req.tanggal;
            if (!grouped[tgl]) {
                grouped[tgl] = req;
            } else if (grouped[tgl].status !== 'pending' && req.status === 'pending') {
                grouped[tgl] = req;
            }
        }
        res.json({ data: Object.values(grouped) });
    } catch (error) {
        console.error('[GetMyRequests] Error fetching personal koreksi requests:', error.message);
        // Return empty array to avoid breaking frontend Promise.all
        res.json({ data: [] });
    }
};
