const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Announcement = sequelize.define('Announcement', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    created_by: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'User yang membuat pengumuman (HR, Manager, etc)'
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
    },
    role_targets: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Array of roles targeted. Null = public'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Tanggal kadaluarsa pengumuman'
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at'
    }
}, {
    tableName: 'announcements',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Announcement;
