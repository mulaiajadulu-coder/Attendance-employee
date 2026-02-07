const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Shift = sequelize.define('Shift', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    nama_shift: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    jam_masuk: {
        type: DataTypes.TIME,
        allowNull: false
    },
    jam_pulang: {
        type: DataTypes.TIME,
        allowNull: false
    },
    toleransi_menit: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    durasi_jam_kerja: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false
    },
    keterangan: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'shift_kerja',
    timestamps: true
});

module.exports = Shift;
