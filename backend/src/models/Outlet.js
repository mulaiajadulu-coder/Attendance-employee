const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Outlet = sequelize.define('Outlet', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    nama: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Nama cabang/store, misal: Kids Kingdom LP Cianjur'
    },
    alamat: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    radius_meter: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        comment: 'Jarak toleransi absen dalam meter'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'outlets',
    timestamps: true
});

module.exports = Outlet;
