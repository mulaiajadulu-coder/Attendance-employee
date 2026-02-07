const { User, Departemen, Shift } = require('../models');

const seedData = async () => {
    try {
        console.log('Starting database seeding...');

        // Create Departemen
        const departemenIT = await Departemen.create({
            nama_departemen: 'IT',
            kode_departemen: 'IT'
        });

        const departemenHR = await Departemen.create({
            nama_departemen: 'Human Resources',
            kode_departemen: 'HR'
        });

        const departemenFinance = await Departemen.create({
            nama_departemen: 'Finance',
            kode_departemen: 'FIN'
        });

        console.log('✓ Departemen created');

        // Create Shift
        const shiftRegular = await Shift.create({
            nama_shift: 'Regular',
            jam_masuk: '08:00:00',
            jam_pulang: '17:00:00',
            toleransi_menit: 15,
            durasi_jam_kerja: 9.0,
            keterangan: 'Shift kerja regular 08:00 - 17:00'
        });

        const shiftPagi = await Shift.create({
            nama_shift: 'Pagi',
            jam_masuk: '07:00:00',
            jam_pulang: '15:00:00',
            toleransi_menit: 10,
            durasi_jam_kerja: 8.0,
            keterangan: 'Shift pagi 07:00 - 15:00'
        });

        const shiftSiang = await Shift.create({
            nama_shift: 'Siang',
            jam_masuk: '15:00:00',
            jam_pulang: '23:00:00',
            toleransi_menit: 10,
            durasi_jam_kerja: 8.0,
            keterangan: 'Shift siang 15:00 - 23:00'
        });

        console.log('✓ Shift created');

        // Create Admin User
        const admin = await User.create({
            nik: 'ADMIN001',
            email: 'admin@company.com',
            password_hash: 'admin123', // Will be hashed by model hook
            nama_lengkap: 'Administrator',
            role: 'admin',
            departemen_id: departemenIT.id,
            shift_default_id: shiftRegular.id,
            tanggal_bergabung: '2024-01-01',
            status_aktif: true,
            gaji_pokok: 15000000
        });

        console.log('✓ Admin user created');
        console.log('  NIK: ADMIN001');
        console.log('  Password: admin123');

        // Create HR HO (Home Office)
        const hrHO = await User.create({
            nik: 'HRHO001',
            email: 'hr-ho@company.com',
            password_hash: 'hr123',
            nama_lengkap: 'HR Manager HO',
            role: 'hr',
            jabatan: 'HR Manager HO',
            departemen_id: departemenHR.id,
            shift_default_id: shiftRegular.id,
            tanggal_bergabung: '2024-01-01',
            status_aktif: true,
            gaji_pokok: 15000000
        });

        // Create HR Cabang
        const hrCabang = await User.create({
            nik: 'HRCB001',
            email: 'hr-cabang@company.com',
            password_hash: 'hr123',
            nama_lengkap: 'HR Cabang Jakarta',
            role: 'hr_cabang',
            jabatan: 'HR Cabang',
            atasan_id: hrHO.id,
            departemen_id: departemenHR.id,
            shift_default_id: shiftRegular.id,
            tanggal_bergabung: '2024-01-02',
            status_aktif: true,
            gaji_pokok: 10000000
        });

        console.log('✓ HR Hierarchy created');

        // Create General Manager
        const gm = await User.create({
            nik: 'GM001',
            email: 'gm@company.com',
            password_hash: 'gm123',
            nama_lengkap: 'General Manager Utama',
            role: 'general_manager',
            jabatan: 'General Manager',
            departemen_id: departemenIT.id,
            shift_default_id: shiftRegular.id,
            tanggal_bergabung: '2024-01-01',
            status_aktif: true,
            gaji_pokok: 30000000
        });

        // Create Area Manager
        const am = await User.create({
            nik: 'AM001',
            email: 'am@company.com',
            password_hash: 'am123',
            nama_lengkap: 'Area Manager Jakarta',
            role: 'area_manager',
            jabatan: 'Area Manager',
            atasan_id: gm.id,
            departemen_id: departemenIT.id,
            shift_default_id: shiftRegular.id,
            tanggal_bergabung: '2024-01-01',
            status_aktif: true,
            gaji_pokok: 20000000
        });

        // Create Manager
        const manager = await User.create({
            nik: 'MGR001',
            email: 'manager@company.com',
            password_hash: 'manager123',
            nama_lengkap: 'IT Manager',
            role: 'manager',
            jabatan: 'Manager',
            atasan_id: am.id,
            departemen_id: departemenIT.id,
            shift_default_id: shiftRegular.id,
            tanggal_bergabung: '2024-01-01',
            status_aktif: true,
            gaji_pokok: 15000000
        });

        // Create Admin Cabang
        const adminCabang = await User.create({
            nik: 'ADMCB001',
            email: 'admin-cabang@company.com',
            password_hash: 'admin123',
            nama_lengkap: 'Admin Cabang',
            role: 'admin',
            jabatan: 'Admin Cabang',
            atasan_id: manager.id,
            departemen_id: departemenIT.id,
            shift_default_id: shiftRegular.id,
            tanggal_bergabung: '2024-01-01',
            status_aktif: true,
            gaji_pokok: 9000000
        });

        // Create Supervisor
        const supervisor = await User.create({
            nik: 'SPV001',
            email: 'spv@company.com',
            password_hash: 'spv123',
            nama_lengkap: 'IT Supervisor',
            role: 'supervisor',
            jabatan: 'Supervisor',
            atasan_id: manager.id,
            departemen_id: departemenIT.id,
            shift_default_id: shiftRegular.id,
            tanggal_bergabung: '2024-01-01',
            status_aktif: true,
            gaji_pokok: 10000000
        });

        console.log('✓ Organizational hierarchy created');

        // Create Employee
        const employee = await User.create({
            nik: 'EMP001',
            email: 'employee@company.com',
            password_hash: 'emp123',
            nama_lengkap: 'John Doe',
            role: 'karyawan',
            jabatan: 'Pramuniaga',
            departemen_id: departemenIT.id,
            atasan_id: supervisor.id,
            shift_default_id: shiftRegular.id,
            tanggal_bergabung: '2024-02-01',
            status_aktif: true,
            gaji_pokok: 8000000
        });

        console.log('✓ Employee user created');
        console.log('  NIK: EMP001 (Superior: SPV001)');

        // Create another employee
        await User.create({
            nik: 'EMP002',
            email: 'jane@company.com',
            password_hash: 'emp123',
            nama_lengkap: 'Jane Smith',
            role: 'karyawan',
            jabatan: 'Cashier',
            departemen_id: departemenIT.id,
            atasan_id: supervisor.id,
            shift_default_id: shiftRegular.id,
            tanggal_bergabung: '2024-03-01',
            status_aktif: true,
            gaji_pokok: 7500000
        });

        console.log('✓ Employee 2 created');

        console.log('\n='.repeat(50));
        console.log('✓ Database seeding completed successfully!');
        console.log('='.repeat(50));
        console.log('\nTest Accounts Hierarchy:');
        console.log('1. Admin      - ADMIN001 (Super Power)');
        console.log('2. GM         - GM001 (Top Level)');
        console.log('3. AM         - AM001 (Reports to GM)');
        console.log('4. Manager    - MGR001 (Reports to AM)');
        console.log('5. Supervisor - SPV001 (Reports to Manager)');
        console.log('6. Employee   - EMP001 (Reports to SPV)');
        console.log('7. HR         - HR001 (HR Manager)');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
};

module.exports = seedData;
