const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cuti = sequelize.define('Cuti', {
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
    tipe_cuti: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tanggal_mulai: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    tanggal_selesai: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    jumlah_hari: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    alasan: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    bukti_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL file bukti misal surat dokter'
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    },
    catatan_approval: {
        type: DataTypes.TEXT,
        allowNull: true
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
    }
}, {
    tableName: 'cuti',
    timestamps: true
});

module.exports = Cuti;
