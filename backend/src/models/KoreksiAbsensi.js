const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const KoreksiAbsensi = sequelize.define('KoreksiAbsensi', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    tanggal: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    jam_masuk_baru: {
        type: DataTypes.TIME, // Menggunakan TIME karena hanya jam
        allowNull: false
    },
    jam_pulang_baru: {
        type: DataTypes.TIME,
        allowNull: false
    },
    alasan: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    bukti_foto_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    },
    approved_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    approved_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    catatan_approval: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'koreksi_absensis',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id', 'status']
        },
        {
            fields: ['tanggal']
        }
    ]
});

module.exports = KoreksiAbsensi;
