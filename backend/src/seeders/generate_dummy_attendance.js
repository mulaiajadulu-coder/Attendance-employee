const { Absensi, User, Shift } = require('../models');

const generateAttendance = async () => {
    try {
        console.log('Generating dummy attendance data...');

        const emp1 = await User.findOne({ where: { nik: 'EMP001' } });
        const emp2 = await User.findOne({ where: { nik: 'EMP002' } });
        const shiftRegular = await Shift.findOne({ where: { nama_shift: 'Regular' } });

        if (!emp1 || !emp2 || !shiftRegular) {
            console.error('User or Shift not found. Run seeder first.');
            process.exit(1);
        }

        const records = [];

        // Helper to create date object from string
        const createDate = (dateStr, timeStr) => {
            return new Date(`${dateStr}T${timeStr}.000Z`); // UTC time roughly
        };

        // Data for EMP001 (The diligent one)
        // 29 Jan: On Time
        records.push({
            user_id: emp1.id,
            tanggal: '2026-01-29',
            jam_masuk: '2026-01-29 07:50:00',
            jam_pulang: '2026-01-29 17:05:00',
            shift_id: shiftRegular.id,
            status_hadir: 'hadir',
            status_terlambat: false,
            menit_terlambat: 0,
            status_pulang_cepat: false,
            menit_pulang_cepat: 0,
            total_jam_kerja: 9.15,
            foto_masuk_url: 'uploads/absensi/masuk/dummy_emp1_in.jpg',
            foto_pulang_url: 'uploads/absensi/pulang/dummy_emp1_out.jpg',
            lokasi_masuk: '-6.200000,106.816666',
            lokasi_pulang: '-6.200000,106.816666'
        });

        // 30 Jan: On Time
        records.push({
            user_id: emp1.id,
            tanggal: '2026-01-30',
            jam_masuk: '2026-01-30 07:55:00',
            jam_pulang: '2026-01-30 17:01:00',
            shift_id: shiftRegular.id,
            status_hadir: 'hadir',
            status_terlambat: false,
            menit_terlambat: 0,
            status_pulang_cepat: false,
            menit_pulang_cepat: 0,
            total_jam_kerja: 9.10,
            foto_masuk_url: 'uploads/absensi/masuk/dummy_emp1_in.jpg',
            foto_pulang_url: 'uploads/absensi/pulang/dummy_emp1_out.jpg',
            lokasi_masuk: '-6.200000,106.816666',
            lokasi_pulang: '-6.200000,106.816666'
        });

        // Data for EMP002 (Karyawan bandel - Late & Early Leave)
        // 29 Jan: Late (08:30)
        records.push({
            user_id: emp2.id,
            tanggal: '2026-01-29',
            jam_masuk: '2026-01-29 08:30:00',
            jam_pulang: '2026-01-29 17:00:00',
            shift_id: shiftRegular.id,
            status_hadir: 'hadir',
            status_terlambat: true,
            menit_terlambat: 30, // Late 30 mins
            status_pulang_cepat: false,
            menit_pulang_cepat: 0,
            total_jam_kerja: 8.50,
            foto_masuk_url: 'uploads/absensi/masuk/dummy_emp2_in.jpg',
            foto_pulang_url: 'uploads/absensi/pulang/dummy_emp2_out.jpg',
            lokasi_masuk: '-6.200000,106.816666',
            lokasi_pulang: '-6.200000,106.816666'
        });

        // 30 Jan: Pulang Cepat (14:00)
        records.push({
            user_id: emp2.id,
            tanggal: '2026-01-30',
            jam_masuk: '2026-01-30 08:00:00',
            jam_pulang: '2026-01-30 14:00:00',
            shift_id: shiftRegular.id,
            status_hadir: 'hadir',
            status_terlambat: false,
            menit_terlambat: 0,
            status_pulang_cepat: true,
            menit_pulang_cepat: 180, // 3 hours early
            total_jam_kerja: 6.00,
            foto_masuk_url: 'uploads/absensi/masuk/dummy_emp2_in.jpg',
            foto_pulang_url: 'uploads/absensi/pulang/dummy_emp2_out.jpg',
            lokasi_masuk: '-6.200000,106.816666',
            lokasi_pulang: '-6.200000,106.816666'
        });

        // Bulk insert
        await Absensi.bulkCreate(records);
        console.log(`✓ Successfully created ${records.length} dummy attendance records.`);
        process.exit(0);

    } catch (err) {
        console.error('Error generating dummy data:', err);
        process.exit(1);
    }
};

generateAttendance();
