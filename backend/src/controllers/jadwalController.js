const { Jadwal, User, Shift, ShiftChangeRequest, sequelize } = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// 1. Upload Bulk Schedule from Matrix Excel
exports.uploadBulkJadwal = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'File Excel wajib diunggah' });
    }

    const t = await sequelize.transaction();

    try {
        const currentUser = req.user;
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const data = XLSX.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return res.status(400).json({ success: false, message: 'File Excel kosong' });
        }

        const firstRow = data[0];
        const tahun = firstRow['TAHUN'] || new Date().getFullYear();
        const bulan = firstRow['BULAN'] || (new Date().getMonth() + 2); // default to next month (1-indexed)

        const results = {
            successCount: 0,
            failedCount: 0,
            errors: []
        };

        // Mapping symbols based on user request:
        // . or - -> Pagi
        // X -> Siang
        const SYMBOL_MAP = {
            '-': 'Pagi',
            '.': 'Pagi',
            'X': 'Siang',
            'x': 'Siang'
        };

        const allShifts = await Shift.findAll();
        const shiftMap = {};
        allShifts.forEach(s => {
            shiftMap[s.nama_shift.toLowerCase()] = s.id;
        });

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const nik = row['NIK'];

            if (!nik) continue;

            const user = await User.findOne({ where: { nik } });
            if (!user) {
                results.failedCount++;
                results.errors.push(`Baris ${i + 2}: NIK ${nik} tidak ditemukan`);
                continue;
            }

            if (currentUser.role === 'hr_cabang' && user.penempatan_store !== currentUser.penempatan_store) {
                results.failedCount++;
                results.errors.push(`Baris ${i + 2}: Akses ditolak untuk NIK ${nik}`);
                continue;
            }

            for (let day = 1; day <= 31; day++) {
                const symbol = row[String(day)];
                if (!symbol) continue;

                let shiftId = null;
                const normalizedSymbol = symbol.toUpperCase();

                if (normalizedSymbol === 'O') {
                    shiftId = null; // Explicit Off
                } else if (SYMBOL_MAP[symbol]) {
                    const shiftName = SYMBOL_MAP[symbol];
                    shiftId = shiftMap[shiftName.toLowerCase()];
                    if (!shiftId) {
                        results.failedCount++;
                        results.errors.push(`Baris ${i + 2}, Tgl ${day}: Shift "${shiftName}" tidak ditemukan`);
                        continue;
                    }
                } else {
                    // Skip unknown symbols
                    continue;
                }

                const tanggalStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dateObj = new Date(tanggalStr);
                if (dateObj.getDate() !== day) continue;

                const [jadwal, created] = await Jadwal.findOrCreate({
                    where: { user_id: user.id, tanggal: tanggalStr },
                    defaults: { shift_id: shiftId },
                    transaction: t
                });

                if (!created) {
                    jadwal.shift_id = shiftId;
                    await jadwal.save({ transaction: t });
                }
            }
            results.successCount++;
        }

        await t.commit();
        fs.unlinkSync(req.file.path);
        res.json({ success: true, message: `Berhasil memproses ${results.successCount} karyawan.`, data: results });
    } catch (error) {
        if (t) await t.rollback();
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Generate Matrix Template Excel
exports.getTemplateJadwal = async (req, res) => {
    try {
        const currentUser = req.user;
        let whereUser = { status_aktif: true };
        if (currentUser.role === 'hr_cabang') {
            whereUser.penempatan_store = currentUser.penempatan_store;
        }

        const employees = await User.findAll({
            where: whereUser,
            attributes: ['nik', 'nama_lengkap', 'penempatan_store', 'jabatan']
        });

        const today = new Date();
        const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const year = nextMonthDate.getFullYear();
        const month = nextMonthDate.getMonth() + 1;

        const templateData = employees.map(emp => {
            const row = {
                'NIK': emp.nik,
                'Nama': emp.nama_lengkap,
                'Store': emp.penempatan_store,
                'Jabatan': emp.jabatan,
                'TAHUN': year,
                'BULAN': month
            };
            for (let i = 1; i <= 31; i++) row[String(i)] = '';
            return row;
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(templateData);
        XLSX.utils.book_append_sheet(wb, ws, 'Jadwal Matrix');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', `attachment; filename=Template_Matrix_${year}_${month}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Get Jadwal for monitoring
exports.getJadwalByStore = async (req, res) => {
    try {
        const { store, start_date, end_date } = req.query;
        const whereClause = { tanggal: { [Op.between]: [start_date, end_date] } };
        const jadwal = await Jadwal.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    where: store ? { penempatan_store: store } : {},
                    attributes: ['id', 'nik', 'nama_lengkap', 'penempatan_store']
                },
                { model: Shift, as: 'shift', attributes: ['id', 'nama_shift', 'jam_masuk', 'jam_pulang'] }
            ],
            order: [['tanggal', 'ASC']]
        });
        res.json({ success: true, data: jadwal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Get Current User Schedule for a specific date (Tukar Shift helper)
exports.getMyJadwalByDate = async (req, res) => {
    try {
        const { tanggal } = req.query;
        if (!tanggal) return res.status(400).json({ success: false, message: 'Tanggal wajib diisi' });

        const userId = req.user.id;

        // 1. PRIORITAS: Cek apakah ada Tukar Shift yang sudah DISETUJUI untuk tanggal ini
        const approvedChange = await ShiftChangeRequest.findOne({
            where: { user_id: userId, tanggal: tanggal, status: 'approved' },
            include: [{ model: Shift, as: 'shift_tujuan' }],
            order: [['updated_at', 'DESC']]
        });

        if (approvedChange) {
            if (approvedChange.shift_tujuan) {
                return res.json({
                    success: true,
                    data: approvedChange.shift_tujuan,
                    is_scheduled: true,
                    is_changed: true
                });
            } else {
                return res.json({
                    success: true,
                    data: null,
                    is_scheduled: true,
                    is_off: true,
                    is_changed: true
                });
            }
        }

        const scheduled = await Jadwal.findOne({
            where: { user_id: userId, tanggal: tanggal },
            include: [{ model: Shift, as: 'shift' }]
        });

        if (scheduled) {
            if (scheduled.shift) {
                return res.json({
                    success: true,
                    data: scheduled.shift,
                    is_scheduled: true
                });
            } else {
                return res.json({
                    success: true,
                    data: null,
                    is_scheduled: true,
                    is_off: true
                });
            }
        }

        const user = await User.findByPk(userId, {
            include: [{ association: 'shift_default' }]
        });

        res.json({
            success: true,
            data: user.shift_default,
            is_scheduled: false
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
