const { sequelize, testConnection } = require('../config/database');
const Outlet = require('./Outlet');
const User = require('./User');
const Departemen = require('./Departemen');
const Shift = require('./Shift');
const Absensi = require('./Absensi');
const Cuti = require('./Cuti');
const KoreksiAbsensi = require('./KoreksiAbsensi');
const SlipGaji = require('./SlipGaji');
const Jadwal = require('./Jadwal');
const Notification = require('./Notification');
const Announcement = require('./Announcement');

// --- Define relationships ---

// 1. Departemen & User
User.belongsTo(Departemen, { foreignKey: 'departemen_id', as: 'departemen' });
Departemen.hasMany(User, { foreignKey: 'departemen_id', as: 'karyawan' });

// 2. Shift & User
User.belongsTo(Shift, { foreignKey: 'shift_default_id', as: 'shift_default' });
Shift.hasMany(User, { foreignKey: 'shift_default_id', as: 'karyawan' });

// 3. User & Atasan (Self-reference)
User.belongsTo(User, { foreignKey: 'atasan_id', as: 'atasan' });
User.hasMany(User, { foreignKey: 'atasan_id', as: 'bawahan' });

// 4. Absensi Relationships
Absensi.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Absensi, { foreignKey: 'user_id', as: 'absensi' });

Absensi.belongsTo(Shift, { foreignKey: 'shift_id', as: 'shift' });
Shift.hasMany(Absensi, { foreignKey: 'shift_id', as: 'absensi' });

// New: User - Homebase Outlet
User.belongsTo(Outlet, { foreignKey: 'homebase_id', as: 'homebase' });
Outlet.hasMany(User, { foreignKey: 'homebase_id', as: 'karyawan' });

// New: Absensi - Outlet
Absensi.belongsTo(Outlet, { foreignKey: 'outlet_id', as: 'outlet' });
Outlet.hasMany(Absensi, { foreignKey: 'outlet_id', as: 'absensi' });

// 5. Cuti Relationships
Cuti.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Cuti, { foreignKey: 'user_id', as: 'cuti' });

Cuti.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// 6. Koreksi Absensi Relationships
KoreksiAbsensi.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(KoreksiAbsensi, { foreignKey: 'user_id', as: 'koreksi_absensi' });

// KoreksiAbsensi decoupled from Absensi ID to support "Mangkir" correction (where Absensi record doesn't exist yet)
// KoreksiAbsensi.belongsTo(Absensi, { foreignKey: 'absensi_id', as: 'absensi_original' });
// Absensi.hasOne(KoreksiAbsensi, { foreignKey: 'absensi_id', as: 'koreksi' });

KoreksiAbsensi.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// 7. Slip Gaji Relationships
SlipGaji.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(SlipGaji, { foreignKey: 'user_id', as: 'slip_gaji' });

SlipGaji.belongsTo(User, { foreignKey: 'generated_by', as: 'generator' });

const ShiftChangeRequest = require('./ShiftChangeRequest');

// ... (previous imports)

// 8. Shift Change Request Relationships
ShiftChangeRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(ShiftChangeRequest, { foreignKey: 'user_id', as: 'shift_requests' });

ShiftChangeRequest.belongsTo(Shift, { foreignKey: 'shift_asal_id', as: 'shift_asal' });
ShiftChangeRequest.belongsTo(Shift, { foreignKey: 'shift_tujuan_id', as: 'shift_tujuan' });

ShiftChangeRequest.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// 9. Jadwal Relationships
Jadwal.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Jadwal, { foreignKey: 'user_id', as: 'jadwal' });

Jadwal.belongsTo(Shift, { foreignKey: 'shift_id', as: 'shift' });
Shift.hasMany(Jadwal, { foreignKey: 'shift_id', as: 'jadwal' });

// 10. Notifications
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' }); // Added
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

// 11. Announcements
Announcement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Announcement, { foreignKey: 'created_by', as: 'announcements' });

// Sync database function
// Sync database function
const syncDatabase = async (force = false) => {
    try {
        await sequelize.sync({ force, alter: true });
        // No log here to keep things clean, or just a very brief one
        // console.log('✓ DB Synced');
    } catch (error) {
        if (error.original && error.original.code === '42704') {
            try {
                await sequelize.sync({ force, alter: false });
                return;
            } catch (retryError) {
                console.error('✗ DB Sync Failed:', retryError.message);
                throw retryError;
            }
        }
        console.error('✗ DB Sync Failed:', error.message);
        throw error;
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase,
    User,
    Departemen,
    Shift,
    Absensi,
    Cuti,
    KoreksiAbsensi,
    SlipGaji,
    Outlet,
    ShiftChangeRequest,
    Notification,
    Announcement,
    Jadwal
};
