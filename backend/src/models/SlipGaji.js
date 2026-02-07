const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SlipGaji = sequelize.define('SlipGaji', {
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
    periode_bulan: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    periode_tahun: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    gaji_pokok: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    total_tunjangan: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    total_potongan: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    gaji_bersih: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    detail_komponen: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'JSON detail tunjangan dan potongan spesifik'
    },
    jumlah_kehadiran: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    jumlah_terlambat: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    jumlah_lembur_jam: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('draft', 'published'),
        defaultValue: 'draft'
    },
    published_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    generated_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'slip_gaji',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'periode_bulan', 'periode_tahun']
        }
    ]
});

module.exports = SlipGaji;
