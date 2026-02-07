const { User, Shift, Departemen, Outlet } = require('../models');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting Database Seeder...');

        // 1. Create Default Shift (Office Hours)
        const [shift, createdShift] = await Shift.findOrCreate({
            where: { nama_shift: 'Office Hours' },
            defaults: {
                jam_masuk: '09:00:00',
                jam_keluar: '17:00:00',
                deskripsi: 'Regular Office Hours'
            }
        });

        // 2. Create Default Departemen
        const [dept, createdDept] = await Departemen.findOrCreate({
            where: { nama_departemen: 'Human Resources' },
            defaults: {
                deskripsi: 'HR Department'
            }
        });

        // 3. Create Default Outlet (Head Office)
        const [outlet, createdOutlet] = await Outlet.findOrCreate({
            where: { nama_outlet: 'Head Office' },
            defaults: {
                alamat: 'Jakarta',
                lokasi_lat: -6.2088,
                lokasi_long: 106.8456,
                radius_km: 0.5
            }
        });

        // 4. Create Admin User (EMP001) if not exists
        const adminUser = await User.findOne({ where: { nik: 'EMP001' } });
        if (!adminUser) {
            await User.create({
                nik: 'EMP001',
                email: 'admin@company.com',
                password_hash: 'emp123', // Will be hashed by hook
                nama_lengkap: 'Admin HR',
                role: 'admin',
                jabatan: 'HR Manager',
                departemen_id: dept.id,
                shift_default_id: shift.id,
                homebase_id: outlet.id,
                tanggal_bergabung: new Date(),
                status_aktif: true,
                jatah_cuti: 12,
                sisa_cuti: 12
            });
            console.log('✅ Admin User (EMP001) Created');
        } else {
            console.log('ℹ️ Admin User already exists');
        }

        // 5. Create Employee User (EMP002) if not exists
        const empUser = await User.findOne({ where: { nik: 'EMP002' } });
        if (!empUser) {
            await User.create({
                nik: 'EMP002',
                email: 'user@company.com',
                password_hash: 'emp123', // Will be hashed by hook
                nama_lengkap: 'Employee Demo',
                role: 'karyawan',
                jabatan: 'Staff',
                departemen_id: dept.id,
                shift_default_id: shift.id,
                homebase_id: outlet.id,
                tanggal_bergabung: new Date(),
                status_aktif: true,
                jatah_cuti: 12,
                sisa_cuti: 12
            });
            console.log('✅ Employee User (EMP002) Created');
        }

        console.log('✨ Database Seeding Completed');
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
    }
};

module.exports = seedDatabase;
