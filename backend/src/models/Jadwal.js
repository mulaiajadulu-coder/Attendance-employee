const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Jadwal = sequelize.define('Jadwal', {
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
    shift_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'shift_kerja',
            key: 'id'
        }
    },
    tanggal: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    keterangan: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'jadwal',
    timestamps: true,
    underscored: true
});

module.exports = Jadwal;
