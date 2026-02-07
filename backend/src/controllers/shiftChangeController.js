const { ShiftChangeRequest, User, Shift, Jadwal, sequelize } = require('../models');
const { Op } = require('sequelize');

// 1. Request Shift Change
exports.createRequest = async (req, res) => {
    try {
        const { tanggal, shift_asal_id, shift_tujuan_id, alasan } = req.body;
        const userId = req.user.id;

        // Validation
        if (!tanggal || !alasan) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Data tidak lengkap' }
            });
        }

        // Validasi: Tidak boleh mundur tanggal (Past Date)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reqDate = new Date(tanggal);
        reqDate.setHours(0, 0, 0, 0);

        if (reqDate < today) {
            return res.status(400).json({
                success: false,
                error: { code: 'BACKDATE_ERROR', message: 'Tidak boleh mengajukan tukar shift untuk tanggal yang sudah lewat' }
            });
        }

        // Check if already exists for date
        const existing = await ShiftChangeRequest.findOne({
            where: {
                user_id: userId,
                tanggal: tanggal,
                status: 'pending'
            }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                error: { code: 'DUPLICATE_REQUEST', message: 'Sudah ada pengajuan pending untuk tanggal ini' }
            });
        }

        const request = await ShiftChangeRequest.create({
            user_id: userId,
            tanggal,
            shift_asal_id: (shift_asal_id === 'OFF' || !shift_asal_id) ? null : shift_asal_id,
            shift_tujuan_id: (shift_tujuan_id === 'OFF' || !shift_tujuan_id) ? null : shift_tujuan_id,
            alasan
        });

        // NOTIFICATION: Notify supervisor
        try {
            const { Notification } = require('../models');
            const atasanId = req.user.atasan_id || (req.user.atasan ? req.user.atasan.id : null);

            if (atasanId) {
                await Notification.create({
                    user_id: atasanId,
                    actor_id: userId,
                    type: 'shift_change_request',
                    title: `Pengajuan Tukar Shift: ${req.user.nama_lengkap}`,
                    message: `${req.user.nama_lengkap} (NIK: ${req.user.nik}) mengajukan tukar shift untuk tanggal ${tanggal}.`,
                    data: { shift_change_id: request.id },
                    read: false
                });
                console.log(`[ShiftChange] Notification created for supervisor ${atasanId}`);
            } else {
                // Fallback to HR if no direct supervisor
                const hrUser = await User.findOne({ where: { role: 'hr' }, attributes: ['id'] });
                if (hrUser) {
                    await Notification.create({
                        user_id: hrUser.id,
                        actor_id: userId,
                        type: 'shift_change_request',
                        title: `Pengajuan Tukar Shift: ${req.user.nama_lengkap}`,
                        message: `${req.user.nama_lengkap} (NIK: ${req.user.nik}) mengajukan tukar shift untuk tanggal ${tanggal}.`,
                        data: { shift_change_id: request.id },
                        read: false
                    });
                }
            }
        } catch (notifError) {
            console.error('[ShiftChange] Notification failed:', notifError);
            // Non-blocking: pengajuan tetap sukses walo notif gagal
        }

        res.status(201).json({
            success: true,
            message: 'Pengajuan tukar shift berhasil dibuat',
            data: request
        });

    } catch (error) {
        console.error('Create Shift Change Error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// 2. Get My Requests
exports.getMyRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const requests = await ShiftChangeRequest.findAll({
            where: { user_id: userId },
            include: [
                { model: Shift, as: 'shift_asal', attributes: ['nama_shift', 'jam_masuk', 'jam_pulang'] },
                { model: Shift, as: 'shift_tujuan', attributes: ['nama_shift', 'jam_masuk', 'jam_pulang'] },
                { model: User, as: 'approver', attributes: ['nama_lengkap'] }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Get My Shift Requests Error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// 3. Get Requests for Approval (Subordinates)
exports.getRequestsToApprove = async (req, res) => {
    try {
        const managerId = req.user.id;

        // Find subordinates
        const subordinates = await User.findAll({
            where: { atasan_id: managerId },
            attributes: ['id']
        });

        const subordinateIds = subordinates.map(s => s.id);

        if (subordinateIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const requests = await ShiftChangeRequest.findAll({
            where: {
                user_id: { [Op.in]: subordinateIds },
                status: 'pending'
            },
            include: [
                { model: User, as: 'user', attributes: ['nama_lengkap', 'nik', 'jabatan'] },
                { model: Shift, as: 'shift_asal', attributes: ['nama_shift', 'jam_masuk', 'jam_pulang'] },
                { model: Shift, as: 'shift_tujuan', attributes: ['nama_shift', 'jam_masuk', 'jam_pulang'] }
            ],
            order: [['created_at', 'ASC']]
        });

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Get Approval Requests Error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
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

// 4. Approve/Reject Request
exports.respondRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, keterangan } = req.body; // status: 'approved' | 'rejected'
        const managerId = req.user.id;
        const managerRole = req.user.role;

        const request = await ShiftChangeRequest.findByPk(id, {
            include: [{ model: User, as: 'user' }]
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Permintaan sudah diproses' });
        }

        // Authorization Check (IDOR Prevention)
        const isHR = ['hr', 'admin'].includes(managerRole);
        const isDirectSuperior = String(request.user.atasan_id) === String(managerId);

        if (!isHR && !isDirectSuperior) {
            const isIndirectSuperior = await isSubordinate(managerId, request.user_id);
            if (!isIndirectSuperior) {
                return res.status(403).json({ success: false, message: 'Anda tidak memiliki wewenang untuk menyetujui pengajuan ini' });
            }
        }

        const t = await sequelize.transaction();
        try {
            request.status = status;
            request.approved_by = managerId;
            request.approval_date = new Date();
            request.keterangan_approval = keterangan;

            await request.save({ transaction: t });

            if (status === 'approved') {
                const requestDate = typeof request.tanggal === 'string' ? request.tanggal : new Date(request.tanggal).toISOString().split('T')[0];

                // 1. Update Jadwal (Scheduled Master)
                const [jadwal, created] = await Jadwal.findOrCreate({
                    where: { user_id: request.user_id, tanggal: requestDate },
                    defaults: { shift_id: request.shift_tujuan_id },
                    transaction: t
                });

                if (!created) {
                    jadwal.shift_id = request.shift_tujuan_id;
                    await jadwal.save({ transaction: t });
                }

                // 2. Update existing Absensi record if any (History/Dashboard fix)
                const absensiModel = require('../models').Absensi;
                const absensi = await absensiModel.findOne({
                    where: { user_id: request.user_id, tanggal: requestDate }
                });

                if (absensi) {
                    absensi.shift_id = request.shift_tujuan_id;
                    await absensi.save({ transaction: t });
                }
            }

            await t.commit();

            // Add Notification for User
            const { Notification } = require('../models');
            await Notification.create({
                user_id: request.user_id,
                actor_id: managerId,
                type: 'shift_change_status',
                title: `Pengajuan Tukar Shift ${status === 'approved' ? 'Disetujui' : 'Ditolak'}`,
                message: `Pengajuan tukar shift Anda untuk tanggal ${request.tanggal} telah ${status === 'approved' ? 'disetujui' : 'ditolak'}. ${keterangan ? `Catatan: ${keterangan}` : ''}`,
                data: { shift_change_id: request.id, status: status },
                read: false
            });

            res.json({
                success: true,
                message: `Permintaan ${status === 'approved' ? 'disetujui' : 'ditolak'}`
            });
        } catch (err) {
            await t.rollback();
            throw err;
        }

    } catch (error) {
        console.error('Respond Request Error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};
