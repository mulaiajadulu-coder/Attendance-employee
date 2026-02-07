const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Absensi = sequelize.define('Absensi', {
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
    jam_masuk: {
        type: DataTypes.DATE,
        allowNull: true
    },
    jam_pulang: {
        type: DataTypes.DATE,
        allowNull: true
    },
    shift_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'shift_kerja',
            key: 'id'
        }
    },
    outlet_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'outlets',
            key: 'id'
        },
        comment: 'Lokasi cabang dimana user melakukan absen'
    },
    status_hadir: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'hadir'
    },
    status_terlambat: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    menit_terlambat: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    status_pulang_cepat: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    menit_pulang_cepat: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_jam_kerja: {
        type: DataTypes.DECIMAL(4, 2),
        defaultValue: 0
    },
    mode_kerja: {
        type: DataTypes.STRING,
        defaultValue: 'wfo'
    },
    lokasi_masuk: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    lokasi_pulang: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    foto_masuk_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    foto_pulang_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    face_verified_masuk: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    face_verified_pulang: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    face_confidence_masuk: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    face_confidence_pulang: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    catatan: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'absensi_harian',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'tanggal']
        },

        {
            fields: ['tanggal']
        }
    ]
});

module.exports = Absensi;
