const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShiftChangeRequest = sequelize.define('ShiftChangeRequest', {
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
    shift_asal_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'shift_kerja',
            key: 'id'
        }
    },
    shift_tujuan_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'shift_kerja',
            key: 'id'
        }
    },
    alasan: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
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
    approval_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    keterangan_approval: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'shift_change_requests',
    timestamps: true,
    underscored: true
});

module.exports = ShiftChangeRequest;
