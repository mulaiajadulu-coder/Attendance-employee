const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    actor_id: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    data: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'notifications',
    underscored: true,
    timestamps: true
});

module.exports = Notification;