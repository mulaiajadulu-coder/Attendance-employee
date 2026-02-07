const { Absensi, Shift, User, Jadwal, sequelize } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Helper: Calculate time difference in minutes
const getMinutesDifference = (date1, date2) => {
    const diffMs = Math.abs(date2 - date1);
    return Math.round(diffMs / 60000);
};

// Helper: Calculate duration in hours (decimal)
const getHoursDuration = (startTime, endTime) => {
    const diffMs = endTime - startTime;
    return Number((diffMs / (1000 * 60 * 60)).toFixed(2));
};

// Helper: Get local date string YYYY-MM-DD
const getTodayStr = (date = new Date()) => {
    try {
        return format(date, 'yyyy-MM-dd');
    } catch (e) {
        // Fallback if date-fns fails
        return date.toISOString().split('T')[0];
    }
};

// Logger Helper
const logMonitoring = (msg) => {
    try {
        if (process.env.VERCEL === '1') {
            console.log(`[MONITORING] ${msg}`); // Use console log on Vercel
            return;
        }
        const logPath = path.join(__dirname, '../../monitoring_debug.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    } catch (e) {
        console.error('Logging failed:', e);
    }
};

// Helper: Save Base64 Image to File
const saveBase64Image = (base64String, subDir = 'absensi') => {
    try {
        const isVercel = process.env.VERCEL === '1';
        // On Vercel, use /tmp. On local, use uploads/
        const rootDir = isVercel ? '/tmp' : path.join(__dirname, '../../uploads');
        const uploadDir = path.join(rootDir, subDir);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Remove header and validate mime type
        const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            console.error('Invalid base64 format');
            return null;
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!allowedMimeTypes.includes(mimeType)) {
            console.error('Invalid mime type:', mimeType);
            return null;
        }

        const extension = mimeType.split('/')[1];
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, base64Data, 'base64');
        return isVercel ? `tmp/${subDir}/${fileName}` : `uploads/${subDir}/${fileName}`;
    } catch (error) {
        console.error('Save Image Error:', error);
        return null;
    }
};

// Helper: Parse time string (HH:mm:ss) to Date object for today
const setTimeOnToday = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(':');
    const date = new Date();
    date.setHours(hours, minutes, seconds, 0);
    return date;
};

// Helper: Calculate distance between two coordinates (Simplified Haversine-ish for mock)
const isWithinRadius = (userLat, userLng, targetLat, targetLng, radiusInMeters = 100) => {
    // Mock logic: In real app, use math.sin/cos or a library
    if (!userLat || !userLng) return false;
    // For demonstration, let's assume we allow anything if target is not set
    if (!targetLat || !targetLng) return true;

    const distance = Math.sqrt(Math.pow(userLat - targetLat, 2) + Math.pow(userLng - targetLng, 2)) * 111320; // very rough deg to meters
    return distance <= radiusInMeters;
};

// 1. Check In (Absen Masuk)
exports.checkIn = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { foto, lokasi, user_id_override, outlet_id } = req.body;
        const now = new Date();
        const todayStr = getTodayStr(now);

        // SECURITY FIX: Only Admin/HR can use override
        let userId = req.user.id;
        if (user_id_override) {
            const isAdmin = ['admin', 'hr'].includes(req.user.role);
            if (!isAdmin) {
                await t.rollback();
                return res.status(403).json({
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki wewenang untuk melakukan absen atas nama orang lain.' }
                });
            }
            userId = user_id_override;
        }

        // 1. Validation
        if (!foto) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Foto wajib disertakan' }
            });
        }

        if (!lokasi || !lokasi.lat || !lokasi.lng) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'LOCATION_ERROR', message: 'Lokasi GPS tidak ditemukan.' }
            });
        }

        // --- NEW: Outlet / Location Validation ---
        let selectedOutlet = null;
        if (outlet_id) {
            // Validate specific outlet
            const { Outlet } = require('../models');
            const outlet = await Outlet.findByPk(outlet_id);
            if (!outlet) {
                await t.rollback();
                return res.status(400).json({ success: false, message: 'Outlet tidak valid.' });
            }

            // Check Distance
            const distance = Math.sqrt(Math.pow(lokasi.lat - outlet.latitude, 2) + Math.pow(lokasi.lng - outlet.longitude, 2)) * 111320; // Approximately meters
            if (distance > outlet.radius_meter) {
                // Double check if this is strict. 
                // "gabisa absen kalo ga titik cabang atau kasarnya out radius"
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    error: { code: 'OUT_OF_RANGE', message: `Anda berada diluar radius outlet ${outlet.nama} (${Math.round(distance)}m).` }
                });
            }
            selectedOutlet = outlet;
        } else {
            // Fallback for backward compatibility or direct coordinate check against Homebase?
            // User said: "muncul pilihan store baru bisa absen" -> expects explicit selection.
            // But for safety, check user's homebase if no outlet_id provided?
            // For now, let's Require outlet_id if system is enforced.
            // Or allow generic check for existing mock logic if outlet_id is missing (but eventually deprecate it).

            // Check if strict mode? Let's be strict if they are using the new app version.
            // But valid backup: Check if user is near *any* outlet? No, that's heavy.
            // Let's Require outlet_id for now as per "Pilih Store".
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'NO_OUTLET_SELECTED', message: 'Silakan pilih lokasi outlet/store terlebih dahulu.' }
            });
        }


        // 2. Check if already checked in
        const existingAbsensi = await Absensi.findOne({
            where: { user_id: userId, tanggal: todayStr }
        });

        if (existingAbsensi) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'ALREADY_CHECKED_IN', message: 'Anda sudah absen masuk hari ini' }
            });
        }

        // 3. Get User Shift details
        // Prioritas: 1. Jadwal Khusus Hari Ini, 2. Shift Default User
        const todayJadwal = await Jadwal.findOne({
            where: { user_id: userId, tanggal: todayStr },
            include: [{ model: Shift, as: 'shift' }]
        });

        let shift = null;
        if (todayJadwal && todayJadwal.shift) {
            shift = todayJadwal.shift;
            console.log(`Using Scheduled Shift for user ${userId} on ${todayStr}: ${shift.nama_shift}`);
        } else {
            const user = await User.findByPk(userId, {
                include: [{ association: 'shift_default' }]
            });

            if (!user || !user.shift_default) {
                // Allow Check IN if no shift? Maybe logic "Shift Bebas"? 
                // For now, keep existing logic -> Error if no shift
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    error: { code: 'CONFIG_ERROR', message: 'Shift kerja belum diatur untuk user ini. Tidak ada jadwal khusus maupun shift default.' }
                });
            }
            shift = user.shift_default;
            console.log(`Using Default Shift for user ${userId} on ${todayStr}: ${shift.nama_shift}`);
        }

        // 4. Calculate Lateness
        const shiftStart = setTimeOnToday(shift.jam_masuk);
        const lateMinutes = getMinutesDifference(now, shiftStart);

        // --- LOGIKA BARU: HARD LIMIT & STATUS ---
        const HARD_LIMIT_MINUTES = 120; // Contoh: 2 Jam (120 Menit)
        const SOFT_TOLERANCE = shift.toleransi_menit || 0;

        let statusHadir = 'hadir';
        let isLate = false;
        let requiresKoreksi = false;
        let catatan = '';

        if (now > shiftStart) {
            isLate = true;
            if (lateMinutes > HARD_LIMIT_MINUTES) {
                // LEWAT BATAS TOLERANSI (MANGKIR)
                statusHadir = 'mangkir';
                requiresKoreksi = true;
                catatan = `Absen masuk lewat batas toleransi (${lateMinutes} min). Perlu pengajuan perbaikan.`;
            } else if (lateMinutes > SOFT_TOLERANCE) {
                // MASIH DALAM TOLERANSI (HADIR TELAT)
                statusHadir = 'hadir telat';
            } else {
                // TELAT TAPI DIBAWAH TOLERANSI (TETAP HADIR)
                statusHadir = 'hadir';
            }
        }

        // 5. Mencegah Kasus Tidak Logis (Misal: Shift Pagi absen Malam)
        // Jika absen lebih dari 8 jam sejak shift mulai, otomatis mangkir
        if (lateMinutes > 480) {
            statusHadir = 'mangkir';
            requiresKoreksi = true;
            catatan = `Absen tidak logis (${lateMinutes} min sejak shift mulai).`;
        }

        // 5. Save Photo
        const fotoUrl = saveBase64Image(foto, 'absensi/masuk');

        // 6. Create Absensi Record
        const newAbsensi = await Absensi.create({
            user_id: userId,
            tanggal: todayStr,
            jam_masuk: now,
            shift_id: shift.id,
            outlet_id: selectedOutlet.id, // SAVE LOCAL OUTLET
            status_hadir: statusHadir,
            status_terlambat: isLate,
            menit_terlambat: lateMinutes,
            lokasi_masuk: JSON.stringify(lokasi), // Store full JSON geo if possible, or just string
            foto_masuk_url: fotoUrl,
            catatan: catatan,
            face_verified_masuk: true,
            face_confidence_masuk: 95.0,
            mode_kerja: 'wfo'
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            success: true,
            message: statusHadir === 'mangkir'
                ? 'Absen tercatat sebagai Mangkir (Lewat Batas Toleransi)'
                : (isLate ? `Absen masuk berhasil (Terlambat ${lateMinutes} menit)` : 'Absen masuk berhasil di ' + selectedOutlet.nama),
            data: {
                id: newAbsensi.id,
                jam_masuk: newAbsensi.jam_masuk,
                status_hadir: newAbsensi.status_hadir,
                requires_koreksi: requiresKoreksi,
                shift: {
                    nama: shift.nama_shift,
                    jam_masuk: shift.jam_masuk
                },
                outlet: selectedOutlet.nama
            }
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error('CheckIn Error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// 2. Check Out (Absen Pulang)
exports.checkOut = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { foto, lokasi, catatan, outlet_id } = req.body;
        const userId = req.user.id;
        const now = new Date();
        const todayStr = getTodayStr(now);

        // Validate outlet_id
        if (!outlet_id) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'OUTLET_REQUIRED', message: 'Outlet/Store wajib dipilih untuk absen pulang' }
            });
        }

        // 1. Find today's Check In record
        let absensi = await Absensi.findOne({
            where: { user_id: userId, tanggal: todayStr }
        });

        // If no check-in exists, allow check-out (create record with missing jam_masuk)
        if (!absensi) {
            // Determine shift like in check-in
            const todayJadwal = await Jadwal.findOne({ where: { user_id: userId, tanggal: todayStr }, include: [{ model: Shift, as: 'shift' }] });
            let shift = null;
            if (todayJadwal && todayJadwal.shift) {
                shift = todayJadwal.shift;
            } else {
                const user = await User.findByPk(userId, { include: [{ association: 'shift_default' }] });
                shift = (user && user.shift_default) ? user.shift_default : null;
            }

            const fotoUrl = saveBase64Image(foto, 'absensi/pulang');
            const newAbs = await Absensi.create({
                user_id: userId,
                tanggal: todayStr,
                jam_masuk: null,
                jam_pulang: now,
                shift_id: shift ? shift.id : null,
                outlet_id: outlet_id, // Save outlet for check-out
                status_hadir: 'hadir',
                total_jam_kerja: 0,
                lokasi_pulang: typeof lokasi === 'object' ? JSON.stringify(lokasi) : lokasi,
                foto_pulang_url: fotoUrl,
                catatan: 'Tidak absen masuk'
            }, { transaction: t });

            await t.commit();

            return res.status(201).json({
                success: true,
                message: 'Absen pulang dicatat (tanpa jam masuk). Silakan ajukan perbaikan di Riwayat jika perlu.',
                data: { jam_pulang: newAbs.jam_pulang }
            });
        }

        if (absensi.jam_pulang) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'ALREADY_CHECKED_OUT', message: 'Anda sudah absen pulang hari ini' }
            });
        }

        // Validate: Check-out outlet must match check-in outlet (integrity check)
        if (absensi.outlet_id && absensi.outlet_id !== outlet_id) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: {
                    code: 'OUTLET_MISMATCH',
                    message: 'Anda harus absen pulang di store yang sama dengan saat absen masuk'
                }
            });
        }

        // 2. Update Record
        const totalHours = absensi.jam_masuk ? getHoursDuration(new Date(absensi.jam_masuk), now) : 0;
        const fotoUrl = saveBase64Image(foto, 'absensi/pulang');

        // Check Early Departure
        // Get shift info
        const shift = await Shift.findByPk(absensi.shift_id);
        const shiftEnd = setTimeOnToday(shift.jam_pulang);

        let isEarlyLeave = false;
        let earlyMinutes = 0;

        if (now < shiftEnd) {
            isEarlyLeave = true;
            earlyMinutes = getMinutesDifference(now, shiftEnd);
        }

        absensi.jam_pulang = now;
        absensi.total_jam_kerja = totalHours;
        absensi.lokasi_pulang = typeof lokasi === 'object' ? JSON.stringify(lokasi) : lokasi;
        absensi.foto_pulang_url = fotoUrl;
        absensi.catatan = catatan;
        absensi.status_pulang_cepat = isEarlyLeave;
        absensi.menit_pulang_cepat = earlyMinutes;
        absensi.face_verified_pulang = true; // Mocked
        absensi.face_confidence_pulang = 98.5; // Mocked
        await absensi.save({ transaction: t });
        await t.commit();

        res.json({
            success: true,
            message: 'Absen pulang berhasil. Hati-hati di jalan!',
            data: {
                jam_pulang: absensi.jam_pulang,
                total_jam_kerja: totalHours,
                catatan: absensi.catatan
            }
        });

    } catch (error) {
        await t.rollback();
        console.error('CheckOut Error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// 3. Get Today Status (Untuk Dashboard)
exports.getTodayStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const todayStr = getTodayStr();

        const absensi = await Absensi.findOne({
            where: { user_id: userId, tanggal: todayStr },
            include: [{
                model: Shift,
                as: 'shift',
                attributes: ['nama_shift', 'jam_masuk', 'jam_pulang', 'durasi_jam_kerja']
            }]
        });

        // Check if user is on approved leave today
        const cuti = await require('../models').Cuti.findOne({
            where: {
                user_id: userId,
                status: 'approved',
                tanggal_mulai: { [Op.lte]: todayStr },
                tanggal_selesai: { [Op.gte]: todayStr }
            }
        });

        // Match scheduled shift from Matrix first
        const todayJadwal = await Jadwal.findOne({
            where: { user_id: userId, tanggal: todayStr },
            include: [{ model: Shift, as: 'shift' }]
        });

        // Check for shift change request for today
        const shiftChange = await require('../models').ShiftChangeRequest.findOne({
            where: { user_id: userId, tanggal: todayStr },
            include: [
                { model: require('../models').Shift, as: 'shift_asal', attributes: ['nama_shift', 'jam_masuk', 'jam_pulang', 'durasi_jam_kerja'] },
                { model: require('../models').Shift, as: 'shift_tujuan', attributes: ['nama_shift', 'jam_masuk', 'jam_pulang', 'durasi_jam_kerja'] }
            ],
            order: [['created_at', 'DESC']]
        });

        // Determine effective shift:
        // Priority: 1. Approved Shift Change, 2. Scheduled Jadwal, 3. Default (Now OFF if no jadwal)
        let effectiveShift = null;
        let isScheduledOff = true;

        if (todayJadwal) {
            if (todayJadwal.shift) {
                effectiveShift = todayJadwal.shift;
                isScheduledOff = false;
            } else {
                isScheduledOff = true;
                effectiveShift = null;
            }
        } else {
            // Before schedule is uploaded, treat as OFF
            isScheduledOff = true;
            effectiveShift = null;
        }

        let shiftChangeStatus = null;

        if (shiftChange) {
            if (shiftChange.status === 'approved') {
                effectiveShift = shiftChange.shift_tujuan || effectiveShift;
                shiftChangeStatus = { status: 'approved', request: shiftChange };
                isScheduledOff = false; // If shift change is approved, they are likely not off
            } else if (shiftChange.status === 'pending') {
                shiftChangeStatus = { status: 'pending', request: shiftChange };
            }
        }

        // Default status
        let status = {
            has_checked_in: false,
            has_checked_out: false,
            shift: effectiveShift,
            record: null,
            on_leave: !!cuti,
            leave: cuti || null,
            is_scheduled_off: isScheduledOff,
            shift_change: shiftChangeStatus,
            display_status: isScheduledOff ? '-' : (cuti ? 'cuti' : 'belum absen')
        };

        if (absensi) {
            // Attach missing flags and derived display status
            const missingMasuk = !absensi.jam_masuk;
            const missingPulang = !absensi.jam_pulang;
            const todayStr = getTodayStr();

            const nonCorrectableStatuses = ['cuti', 'sakit', 'izin', 'libur'];
            let displayStatus;

            // Rule: If late > 2 hours (120 mins), status is Mangkir
            const isTooLate = absensi.status_terlambat && absensi.menit_terlambat >= 120;

            if (cuti) {
                displayStatus = 'cuti';
            } else if (isScheduledOff) {
                displayStatus = '-';
            } else if (absensi.status_hadir && nonCorrectableStatuses.includes(absensi.status_hadir)) {
                displayStatus = absensi.status_hadir;
            } else if (isTooLate) {
                displayStatus = 'mangkir';
            } else if (missingMasuk && missingPulang) {
                displayStatus = 'belum absen';
            } else if (missingMasuk) {
                displayStatus = 'tidak absen masuk';
            } else if (missingPulang) {
                displayStatus = 'sedang bekerja';
            } else {
                displayStatus = absensi.status_hadir || 'hadir';
            }

            // Lateness flag for accounting
            const tolerance = (absensi.shift && absensi.shift.toleransi_menit) || effectiveShift.toleransi_menit || 0;
            const late_exceeds_tolerance = !!(absensi.status_terlambat && (absensi.menit_terlambat > tolerance));

            // Calculate live work hours for dashboard
            let currentWorkHours = 0;
            if (absensi.jam_masuk) {
                const checkInTime = new Date(absensi.jam_masuk);
                const endTime = absensi.jam_pulang ? new Date(absensi.jam_pulang) : new Date();
                const diffMs = endTime - checkInTime;
                currentWorkHours = parseFloat((diffMs / 3600000).toFixed(2)); // convert ms to hours
            }

            status = {
                has_checked_in: true,
                has_checked_out: !!absensi.jam_pulang,
                shift: effectiveShift || absensi.shift, // Prioritize current schedule/approval for display
                record: absensi,
                on_leave: !!cuti,
                leave: cuti || null,
                shift_change: shiftChangeStatus,
                missing_masuk: missingMasuk,
                missing_pulang: missingPulang,
                display_status: displayStatus,
                can_request_koreksi: false, // today cannot request koreksi (only past)
                requires_approval: false,
                late_exceeds_tolerance,
                current_work_hours: currentWorkHours,
                target_work_hours: (() => {
                    const s = effectiveShift || (absensi && absensi.shift);
                    if (!s) return 8;
                    if (s.durasi_jam_kerja) return parseFloat(s.durasi_jam_kerja);
                    // Fallback calculation from times
                    if (s.jam_masuk && s.jam_pulang) {
                        const [mH, mM] = s.jam_masuk.split(':').map(Number);
                        const [pH, pM] = s.jam_pulang.split(':').map(Number);
                        let diff = (pH + pM / 60) - (mH + mM / 60);
                        if (diff < 0) diff += 24; // Cross midnight
                        return parseFloat(diff.toFixed(2));
                    }
                    return 8;
                })()
            };

        } // end if (absensi)

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('GetTodayStatus Error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// 4. Get History (Riwayat Absensi)
exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { month, year, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = { user_id: userId };

        // Filter by month/year if provided
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            whereClause.tanggal = {
                [Op.between]: [
                    getTodayStr(startDate),
                    getTodayStr(endDate)
                ]
            };
        }

        const { count, rows } = await Absensi.findAndCountAll({
            where: whereClause,
            include: [{
                model: Shift,
                as: 'shift',
                attributes: ['nama_shift', 'jam_masuk', 'jam_pulang']
            }],
            order: [['tanggal', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Build full date range for requested month (if month/year provided) so UI can show missing days
        const monthQuery = req.query.month;
        const yearQuery = req.query.year;
        let finalRecords = rows.map(r => typeof r.get === 'function' ? r.get({ plain: true }) : r);

        if (monthQuery && yearQuery) {
            const month = parseInt(monthQuery);
            const year = parseInt(yearQuery);
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            const mapByDate = {};
            for (const rec of finalRecords) {
                mapByDate[rec.tanggal] = rec;
            }

            const allDays = [];
            const todayStr = getTodayStr();
            const now = new Date();

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = getTodayStr(new Date(d));
                const record = mapByDate[dateStr];

                // --- DETEKSI SHIFT END ---
                let scheduledShift = record?.shift || { jam_masuk: '08:00:00', jam_pulang: '17:00:00', nama_shift: 'Regular' };
                let isOff = false;

                // Sync with Jadwal for more accurate shift info
                try {
                    const syncJadwal = await Jadwal.findOne({
                        where: { user_id: userId, tanggal: dateStr },
                        include: [{ model: Shift, as: 'shift' }]
                    });
                    if (syncJadwal) {
                        if (syncJadwal.shift) {
                            scheduledShift = syncJadwal.shift;
                        } else {
                            isOff = true;
                            scheduledShift = null;
                        }
                    } else if (!record) {
                        // Before schedule is uploaded, treat as OFF (libur)
                        isOff = true;
                        scheduledShift = null;
                    }
                } catch (e) { }

                // Hitung apakah shift sudah berakhir
                let isShiftEnded = false;
                if (dateStr < todayStr) {
                    isShiftEnded = true;
                } else if (dateStr === todayStr && scheduledShift) {
                    const shiftEnd = new Date(`${dateStr}T${scheduledShift.jam_pulang}`);
                    // Jika shift berakhir melewati tengah malam, ini perlu logika extra, 
                    // tapi asumsikan standard dulu:
                    if (now > shiftEnd) isShiftEnded = true;
                }

                if (record) {
                    // Existing Record Logic
                    const rec = record;
                    rec.shift = scheduledShift;
                    rec.is_missing_masuk = !rec.jam_masuk;
                    rec.is_missing_pulang = !rec.jam_pulang;

                    const nonCorrectableStatuses = ['cuti', 'sakit', 'izin', 'libur'];
                    if (rec.status_hadir && nonCorrectableStatuses.includes(rec.status_hadir)) {
                        rec.display_status = rec.status_hadir;
                        rec.can_request_koreksi = false;
                    } else {
                        // Rule: If late > 2 hours (120 mins), status is Mangkir
                        const isTooLate = rec.status_terlambat && rec.menit_terlambat >= 120;

                        // Logic Status Berdasarkan Shift End
                        if (dateStr > todayStr) {
                            // FUTURE
                            rec.display_status = "-";
                        } else if (isTooLate) {
                            rec.display_status = "mangkir";
                        } else if (!isShiftEnded) {
                            // SHIFT BELUM BERAKHIR
                            if (!rec.is_missing_masuk) {
                                rec.display_status = "sedang bekerja";
                            } else {
                                rec.display_status = "belum absen";
                            }
                        } else {
                            // SHIFT SUDAH BERAKHIR
                            if (rec.is_missing_masuk && rec.is_missing_pulang) {
                                rec.display_status = "mangkir";
                            } else if (rec.is_missing_masuk) {
                                rec.display_status = "tidak absen masuk";
                            } else if (rec.is_missing_pulang) {
                                rec.display_status = "tidak absen pulang";
                            } else {
                                rec.display_status = rec.status_hadir || "hadir";
                            }
                        }

                        // Koreksi diizinkan jika sudah lewat harinya (Past) atau shift berakhir tapi ada yg bolong
                        rec.can_request_koreksi = (dateStr < todayStr || isShiftEnded) && (rec.is_missing_masuk || rec.is_missing_pulang || rec.display_status === 'mangkir');
                    }

                    rec.requires_approval = (dateStr < todayStr);
                    allDays.push(rec);

                } else {
                    // Virtual Record (No record in Absensi table)
                    const isPast = dateStr < todayStr;

                    let displayStatus = "";
                    const isFuture = dateStr > todayStr;

                    if (isFuture) {
                        displayStatus = "-";
                    } else if (isOff) {
                        displayStatus = "-"; // User said '-' considered libur because no schedule
                    } else if (isShiftEnded) {
                        displayStatus = "mangkir";
                    } else {
                        displayStatus = "belum absen";
                    }

                    allDays.push({
                        id: null,
                        user_id: userId,
                        tanggal: dateStr,
                        status_hadir: isOff ? 'libur' : (isShiftEnded ? 'mangkir' : null),
                        display_status: displayStatus,
                        shift: scheduledShift,
                        is_missing_masuk: true,
                        is_missing_pulang: true,
                        can_request_koreksi: (isPast || isShiftEnded) && !isOff,
                        requires_approval: isPast,
                        catatan: isOff ? 'Libur (Jadwal/No Schedule)' : null
                    });
                }
            }

            // sort descending by date
            finalRecords = allDays.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
        }

        res.json({
            success: true,
            data: {
                total_items: count,
                total_pages: Math.ceil(count / limit),
                current_page: parseInt(page),
                records: finalRecords
            }
        });

    } catch (error) {
        console.error('GetHistory Error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// 5. Monitoring Absensi (Untuk Atasan/HR)
const getSubordinates = async (managerId) => {
    const visited = new Set();
    const ids = [];
    const stack = [managerId];
    while (stack.length) {
        const mid = stack.pop();
        if (visited.has(String(mid))) continue;
        visited.add(String(mid));
        const subs = await User.findAll({ where: { atasan_id: mid }, attributes: ['id'], raw: true });
        for (const s of subs) {
            ids.push(s.id);
            stack.push(s.id);
        }
    }
    return ids;
};

exports.getMonitoring = async (req, res) => {

    // --- DEBUG LOG: Semua request monitoring ---
    try {
        const logPath = require('path').join(__dirname, '../../monitoring_debug.log');
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] [MONITORING-REQ] user: ${JSON.stringify(req.user)}, headers: ${JSON.stringify(req.headers)}\n`;
        require('fs').appendFileSync(logPath, logMsg);
    } catch (e) { console.error('Failed to log monitoring request', e); }
    // Helper: Get subordinate ids (non-cyclic)
    const getSubordinates = async (managerId) => {
        const visited = new Set();
        const ids = [];
        const stack = [managerId];
        while (stack.length) {
            const mid = stack.pop();
            if (visited.has(String(mid))) continue;
            visited.add(String(mid));
            const subs = await User.findAll({ where: { atasan_id: mid }, attributes: ['id'], raw: true });
            logMonitoring(`[getSubordinates] Level: ${mid}, found: ${JSON.stringify(subs)}`);
            for (const s of subs) {
                ids.push(String(s.id));
                stack.push(s.id);
            }
        }
        return ids;
    };


    // Log Start
    const reqId = Date.now();
    // Safely stringify a subset of user to avoid circulars
    const shortUser = { id: req.user && req.user.id, nik: req.user && req.user.nik, role: req.user && req.user.role };
    logMonitoring(`[${reqId}] Request started from User: ${JSON.stringify(shortUser)}`);

    try {
        const { date, month, year, search, page = 1, limit = 20, store } = req.query;
        const now = new Date();
        const offset = (page - 1) * limit;
        const hrRoles = ['hr', 'admin', 'hr_cabang'];
        const isHR = hrRoles.includes(req.user.role);
        const userWhereClause = {};

        if (!isHR) {
            // Normalize manager id (some auth flows may provide string ids)
            const managerId = Number(req.user.id) || req.user.id;
            logMonitoring(`[${reqId}] Fetching subordinates for Manager ID: ${managerId} (type: ${typeof managerId})`);

            // Defensive: track visited ids to prevent cycles
            const visited = new Set();
            const getAllSubordinateIds = async (mgrId) => {
                try {
                    if (!mgrId || visited.has(String(mgrId))) return [];
                    visited.add(String(mgrId));

                    const subs = await User.findAll({
                        where: { atasan_id: mgrId },
                        attributes: ['id'],
                        raw: true
                    });

                    const ids = [];
                    for (const s of subs) {
                        ids.push(s.id);
                        const childIds = await getAllSubordinateIds(s.id);
                        if (childIds && childIds.length) ids.push(...childIds);
                    }

                    return ids;
                } catch (err) {
                    logMonitoring(`[${reqId}] Recursion Error: ${err.message}`);
                    throw err;
                }
            };

            // Count direct reports for quick sanity check
            try {
                const directCount = await User.count({ where: { atasan_id: managerId } });
                logMonitoring(`[${reqId}] Direct reports count: ${directCount}`);
            } catch (cErr) {
                logMonitoring(`[${reqId}] Direct count error: ${cErr.message}`);
            }

            const subordinateIds = await getSubordinates(managerId);
            logMonitoring(`[${reqId}] Found Subordinates: ${JSON.stringify(subordinateIds)}`);

            // If no subordinates, return empty early
            if (!subordinateIds || subordinateIds.length === 0) {
                logMonitoring(`[${reqId}] No subordinates found.`);
                return res.json({
                    success: true,
                    data: {
                        total_items: 0,
                        total_pages: 0,
                        current_page: parseInt(page),
                        records: []
                    }
                });
            }

            userWhereClause.id = { [Op.in]: subordinateIds };
        } else {
            // For HR roles, check if hr_cabang needs store filter
            if (req.user.role === 'hr_cabang') {
                if (!req.user.penempatan_store) {
                    logMonitoring(`[${reqId}] HR Cabang has no penempatan_store set.`);
                    return res.status(400).json({
                        success: false,
                        error: { code: 'CONFIG_ERROR', message: 'Penempatan store belum diatur untuk HR Cabang ini' }
                    });
                }
                userWhereClause.penempatan_store = req.user.penempatan_store;
                logMonitoring(`[${reqId}] HR Cabang access: filtering by penempatan_store = ${req.user.penempatan_store}`);
            } else {
                logMonitoring(`[${reqId}] Full HR/Admin access granted. No user filter.`);
            }
        }

        const absensiWhereClause = {};

        // Date selection
        let filterDate = date || getTodayStr();
        absensiWhereClause.tanggal = filterDate;
        logMonitoring(`[${reqId}] Filter Date: ${filterDate}`);

        if (store && store !== 'SEMUA') {
            userWhereClause.penempatan_store = store;
        }

        if (search) {
            logMonitoring(`[${reqId}] Search: ${search}`);
            userWhereClause[Op.or] = [
                { nama_lengkap: { [Op.iLike]: `%${search}%` } },
                { nik: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const today = new Date().toISOString().split('T')[0];
        const isPast = filterDate < today;

        logMonitoring(`[${reqId}] Executing findAndCountAll...`);

        const { count, rows } = await User.findAndCountAll({
            where: userWhereClause,
            attributes: ['id', 'nama_lengkap', 'nik', 'role', 'jabatan', 'penempatan_store'],
            include: [
                {
                    model: Absensi,
                    as: 'absensi',
                    where: absensiWhereClause,
                    required: false, // LEFT JOIN
                    include: [{
                        model: Shift,
                        as: 'shift',
                        attributes: ['nama_shift', 'jam_masuk', 'jam_pulang']
                    }]
                },
                {
                    model: Shift,
                    as: 'shift_default',
                    attributes: ['nama_shift', 'jam_masuk', 'jam_pulang']
                }
            ],
            order: [['nama_lengkap', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        logMonitoring(`[${reqId}] Query success. Rows: ${rows.length}, Total: ${count}`);

        const records = await Promise.all(rows.map(async user => {
            const absensi = (user.absensi && user.absensi.length > 0) ? user.absensi[0] : null;

            const userData = {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                nik: user.nik,
                role: user.role,
                jabatan: user.jabatan,
                penempatan_store: user.penempatan_store
            };

            // Default shift from user.default
            let shiftData = user.shift_default || {
                nama_shift: 'Standard',
                jam_masuk: '08:00:00',
                jam_pulang: '17:00:00'
            };

            // Prefer Jadwal (scheduled shift) for the selected date if exists
            let isOff = false;
            try {
                const jadwal = await Jadwal.findOne({ where: { user_id: user.id, tanggal: filterDate }, include: [{ model: Shift, as: 'shift' }] });
                if (jadwal) {
                    if (jadwal.shift) {
                        shiftData = jadwal.shift;
                        logMonitoring(`[${reqId}] Using Jadwal shift for user ${user.id} on ${filterDate}: ${shiftData.nama_shift}`);
                    } else {
                        isOff = true;
                        shiftData = null;
                        logMonitoring(`[${reqId}] User ${user.id} is scheduled OFF on ${filterDate}`);
                    }
                } else {
                    // [FIX] No schedule found = OFF
                    isOff = true;
                    shiftData = null;
                    logMonitoring(`[${reqId}] No Jadwal found for user ${user.id} on ${filterDate}, treating as OFF`);
                }
            } catch (e) {
                logMonitoring(`[${reqId}] Jadwal lookup failed for user ${user.id} date ${filterDate}: ${e.message}`);
                // Fallback: if check fails, keep current defaults
            }

            // [FIX] Check if shift is ended to avoid showing 'mangkir'/'tidak absen' prematurely
            let isShiftEnded = true;
            if (filterDate === today && shiftData) {
                const endDateTime = setTimeOnToday(shiftData.jam_pulang);
                isShiftEnded = now > endDateTime;
            } else if (filterDate > today) {
                isShiftEnded = false;
            }

            if (absensi) {
                // Ensure the real record has user and shift data
                const record = typeof absensi.get === 'function' ? absensi.get({ plain: true }) : absensi;

                const missingMasuk = !record.jam_masuk;
                const missingPulang = !record.jam_pulang;

                // Determine display status and koreksi rules
                const nonCorrectableStatuses = ['cuti', 'sakit', 'izin', 'libur'];
                let display_status;

                // Rule: If late > 2 hours (120 mins), status is Mangkir regardless of attendance
                const isTooLate = record.status_terlambat && record.menit_terlambat >= 120;

                if (isOff) {
                    display_status = 'OFF';
                } else if (record.status_hadir && nonCorrectableStatuses.includes(record.status_hadir)) {
                    display_status = record.status_hadir;
                } else if (isTooLate) {
                    display_status = 'mangkir';
                } else if (missingMasuk && missingPulang) {
                    display_status = (isPast || isShiftEnded) ? 'mangkir' : 'belum absen';
                } else if (missingMasuk) {
                    display_status = (isPast || isShiftEnded) ? 'tidak absen masuk' : 'belum absen';
                } else if (missingPulang) {
                    display_status = (isPast || isShiftEnded) ? 'tidak absen pulang' : 'sedang bekerja';
                } else {
                    display_status = record.status_hadir || 'hadir';
                }

                // Lateness threshold (for accounting)
                const tolerance = (record.shift && record.shift.toleransi_menit) || shiftData.toleransi_menit || 0;
                const late_exceeds_tolerance = !!(record.status_terlambat && (record.menit_terlambat > tolerance));

                const canRequest = (nonCorrectableStatuses.includes(record.status_hadir || '') === false) && (isPast && (display_status === 'mangkir' || display_status.startsWith('tidak absen')));

                return {
                    ...record,
                    user: userData,
                    shift: record.shift || shiftData,
                    missing_masuk: missingMasuk,
                    missing_pulang: missingPulang,
                    display_status,
                    can_request_koreksi: canRequest,
                    requires_approval: isPast,
                    late_exceeds_tolerance
                };
            } else {
                const virtualStatus = isOff ? 'OFF' : (isPast ? 'mangkir' : 'belum absen');
                const virtual = {
                    id: null,
                    user_id: user.id,
                    tanggal: filterDate,
                    status_hadir: virtualStatus,
                    display_status: virtualStatus,
                    user: userData,
                    shift: shiftData,
                    // Only past virtual absences can request koreksi (not for OFF days)
                    can_request_koreksi: isPast && !isOff,
                    requires_approval: isPast && !isOff,
                    display_status: virtualStatus,
                    missing_masuk: !isOff,
                    missing_pulang: !isOff,
                    late_exceeds_tolerance: false
                };
                return virtual;
            }
        }));

        // Get unique stores for filtering (specifically for HR roles)
        const allStores = await User.findAll({
            attributes: [
                [sequelize.fn('DISTINCT', sequelize.col('penempatan_store')), 'store']
            ],
            where: { penempatan_store: { [Op.ne]: null } },
            raw: true
        });
        const stores = ['SEMUA', ...allStores.map(s => s.store).filter(Boolean).sort()];

        res.json({
            success: true,
            data: {
                total_items: count,
                total_pages: Math.ceil(count / limit),
                current_page: parseInt(page),
                records,
                stores
            }
        });

    } catch (error) {
        logMonitoring(`[ERROR] Monitoring Critical Fail: ${error.message} \nStack: ${error.stack}`);
        console.error('Monitoring Error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data monitoring',
            error: error.message
        });
    }
};

// 6. Analytics for Atasan/HR - real data
exports.getAnalytics = async (req, res) => {
    try {
        const reqId = Date.now();
        logMonitoring(`[${reqId}] getAnalytics called by ${req.user.id} (${req.user.role})`);

        // Build user filter
        let userIds = [];
        if (req.user.role === 'hr' || req.user.role === 'admin') {
            // all active users
            const all = await User.findAll({
                where: { status_aktif: true },
                attributes: ['id'],
                raw: true
            });
            userIds = all.map(u => u.id);
        } else if (req.user.role === 'hr_cabang') {
            // hr_cabang: only active users in same penempatan_store
            if (!req.user.penempatan_store) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'CONFIG_ERROR', message: 'Penempatan store belum diatur untuk HR Cabang ini' }
                });
            }
            const storeUsers = await User.findAll({
                where: {
                    penempatan_store: req.user.penempatan_store,
                    status_aktif: true
                },
                attributes: ['id'],
                raw: true
            });
            userIds = storeUsers.map(u => u.id);
        } else {
            const subs = await getSubordinates(req.user.id);
            // Filter only active subordinates
            const activeSubs = await User.findAll({
                where: {
                    id: { [Op.in]: subs },
                    status_aktif: true
                },
                attributes: ['id'],
                raw: true
            });
            userIds = activeSubs.map(u => u.id);
        }

        const today = getTodayStr();

        // 1. Team Summary (Only if has subordinates)
        let summary = [];
        if (userIds && userIds.length > 0) {
            const { Cuti, Jadwal } = require('../models');

            const terlambatCount = await Absensi.count({ where: { user_id: { [Op.in]: userIds }, tanggal: today, status_terlambat: true } });

            // 1. Get Scheduled IDs (Users who HAVE a shift today)
            const scheduledUsersData = await Jadwal.findAll({
                where: {
                    user_id: { [Op.in]: userIds },
                    tanggal: today,
                    shift_id: { [Op.ne]: null }
                },
                attributes: ['user_id'],
                raw: true
            });
            const scheduledUserIds = new Set(scheduledUsersData.map(j => j.user_id));

            // 2. Get Present IDs (Hadir)
            const presentUsersData = await Absensi.findAll({
                where: {
                    user_id: { [Op.in]: userIds },
                    tanggal: today,
                    status_hadir: 'hadir'
                },
                attributes: ['user_id'],
                raw: true
            });
            const presentUserIds = new Set(presentUsersData.map(a => a.user_id));

            // 3. Get Cuti IDs (Approved Leave)
            const cutiUsersData = await Cuti.findAll({
                where: {
                    user_id: { [Op.in]: userIds },
                    status: 'approved',
                    tanggal_mulai: { [Op.lte]: today },
                    tanggal_selesai: { [Op.gte]: today }
                },
                attributes: ['user_id'],
                raw: true
            });
            const cutiUserIds = new Set(cutiUsersData.map(c => c.user_id));

            // Calculate Counts
            const hadirTotal = presentUserIds.size;
            const cutiCount = cutiUserIds.size;

            // Mangkir = Scheduled AND Not Present AND Not Cuti
            let mangkirCount = 0;
            scheduledUserIds.forEach(id => {
                if (!presentUserIds.has(id) && !cutiUserIds.has(id)) {
                    mangkirCount++;
                }
            });

            // Libur = Total Users - Hadir - Cuti - Mangkir
            // (Assuming everyone else is either explicitly OFF or implicitly OFF)
            const total = userIds.length;
            const liburCount = Math.max(0, total - hadirTotal - cutiCount - mangkirCount);

            summary = [
                { name: 'Hadir', value: Math.max(0, hadirTotal - terlambatCount), color: '#16a34a' },
                { name: 'Terlambat', value: terlambatCount, color: '#ca8a04' },
                { name: 'Cuti', value: cutiCount, color: '#2563eb' },
                { name: 'Libur', value: liburCount, color: '#94a3b8' },
                { name: 'Mangkir', value: mangkirCount, color: '#dc2626' }
            ];
        }

        // 2. Trend (Only if has subordinates)
        const trend = [];
        if (userIds && userIds.length > 0) {
            const trendDays = 7;
            for (let i = trendDays - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const str = getTodayStr(d);
                const had = await Absensi.count({ where: { user_id: { [Op.in]: userIds }, tanggal: str, status_hadir: 'hadir' } });
                const tel = await Absensi.count({ where: { user_id: { [Op.in]: userIds }, tanggal: str, status_terlambat: true } });
                trend.push({ date: str, hadir: had, terlambat: tel });
            }
        }

        // Analytics real-time: Work Hours Comparison (Last 7 Days)
        const workHoursHistory = [];
        const { id: localeId } = require('date-fns/locale/id');

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const str = getTodayStr(d);

            // 1. User Work Hours
            const userAbsensi = await Absensi.findOne({ where: { user_id: req.user.id, tanggal: str } });
            const userHours = userAbsensi ? parseFloat(userAbsensi.total_jam_kerja || 0) : 0;

            // 2. Team Average Work Hours
            let teamAvg = 0;
            const targetIds = (userIds || []).filter(id => String(id) !== String(req.user.id));

            if (targetIds.length > 0) {
                const teamAbsensiResult = await Absensi.findAll({
                    where: {
                        user_id: { [Op.in]: targetIds },
                        tanggal: str,
                        jam_masuk: { [Op.ne]: null },
                        jam_pulang: { [Op.ne]: null }
                    },
                    attributes: [[sequelize.fn('AVG', sequelize.col('total_jam_kerja')), 'avg_hours']],
                    raw: true
                });

                const val = teamAbsensiResult[0]?.avg_hours;
                if (val !== null && val !== undefined) {
                    teamAvg = parseFloat(parseFloat(val).toFixed(1));
                }
            }

            workHoursHistory.push({
                date: format(d, 'dd MMM', { locale: localeId }),
                anda: isNaN(userHours) ? 0 : userHours,
                tim: isNaN(teamAvg) ? 0 : teamAvg
            });
        }

        res.json({ success: true, data: { summary, trend, workHours: workHoursHistory } });

    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 7. Admin / Manager Manual Entry (check in / check out without photo)
exports.adminManualEntry = async (req, res) => {
    try {
        const { user_id, type, time } = req.body; // type: 'in'|'out'
        const actor = req.user;
        const targetUserId = user_id || req.user.id;

        // Authorization: only certain roles can write for others
        const privilegedRoles = ['admin', 'hr', 'manager', 'supervisor', 'area_manager', 'hr_cabang', 'general_manager'];
        if (targetUserId !== req.user.id && !privilegedRoles.includes(actor.role)) {
            return res.status(403).json({ success: false, error: 'Not authorized to modify other users' });
        }

        // If actor is not fully privileged, ensure target is subordinate
        if (targetUserId !== req.user.id && !['admin', 'hr'].includes(actor.role)) {
            const subs = await getSubordinates(req.user.id);
            if (!subs.includes(Number(targetUserId))) {
                return res.status(403).json({ success: false, error: 'Target user is not your subordinate' });
            }
        }

        const todayStr = getTodayStr(time ? new Date(time) : new Date());

        // Fetch or create absensi
        let abs = await Absensi.findOne({ where: { user_id: targetUserId, tanggal: todayStr } });

        if (type === 'in') {
            const now = time ? new Date(time) : new Date();
            if (!abs) {
                // create minimal record
                abs = await Absensi.create({ user_id: targetUserId, tanggal: todayStr, jam_masuk: now, status_hadir: 'hadir', catatan: `Manual masuk oleh ${actor.nama_lengkap || actor.nik}` });
            } else {
                if (abs.jam_masuk) return res.status(400).json({ success: false, error: 'Sudah tercatat jam masuk' });
                abs.jam_masuk = now;
                abs.status_hadir = 'hadir';
                abs.catatan = (abs.catatan ? abs.catatan + ' | ' : '') + `Manual masuk oleh ${actor.nama_lengkap || actor.nik}`;
                await abs.save();
            }

            // compute lateness if shift available
            try {
                const user = await User.findByPk(targetUserId, { include: [{ association: 'shift_default' }] });
                const shift = user && user.shift_default ? user.shift_default : { jam_masuk: '08:00:00', nama_shift: 'Standard' };
                const shiftStart = setTimeOnToday(shift.jam_masuk);
                const lateThreshold = new Date(shiftStart.getTime() + ((shift.toleransi_menit || 0) * 60000));
                if (now > lateThreshold) {
                    abs.status_terlambat = true;
                    abs.menit_terlambat = getMinutesDifference(now, shiftStart);
                    await abs.save();
                }
            } catch (e) {
                // ignore shift calc failure
            }

            return res.json({ success: true, data: abs });
        } else if (type === 'out') {
            const now = time ? new Date(time) : new Date();
            if (!abs) {
                // create a record with only jam_pulang
                abs = await Absensi.create({ user_id: targetUserId, tanggal: todayStr, jam_pulang: now, status_hadir: 'hadir', catatan: `Manual pulang oleh ${actor.nama_lengkap || actor.nik}` });
            } else {
                if (abs.jam_pulang) return res.status(400).json({ success: false, error: 'Sudah tercatat jam pulang' });
                abs.jam_pulang = now;
                abs.catatan = (abs.catatan ? abs.catatan + ' | ' : '') + `Manual pulang oleh ${actor.nama_lengkap || actor.nik}`;

                // compute total hours
                if (abs.jam_masuk) {
                    const totalHours = getHoursDuration(new Date(abs.jam_masuk), now);
                    abs.total_jam_kerja = totalHours;
                }
                await abs.save();
            }

            return res.json({ success: true, data: abs });
        }

        return res.status(400).json({ success: false, error: 'Invalid type' });

    } catch (error) {
        console.error('[AdminManualEntry] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
