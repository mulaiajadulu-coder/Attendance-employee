const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Departemen = sequelize.define('Departemen', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    nama_departemen: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    kode_departemen: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'departemen',
    timestamps: true
});

module.exports = Departemen;
