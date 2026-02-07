const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    nik: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    no_hp: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    otp_code: {
        type: DataTypes.STRING(6),
        allowNull: true
    },
    otp_expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    nama_lengkap: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'karyawan'
    },
    jabatan: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    departemen_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'departemen',
            key: 'id'
        }
    },
    atasan_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    shift_default_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'shift_kerja',
            key: 'id'
        }
    },
    tanggal_bergabung: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status_aktif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    foto_profil_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    face_encoding: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    gaji_pokok: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
    },
    penempatan_store: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    homebase_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'outlets',
            key: 'id'
        }
    },
    jatah_cuti: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Total jatah cuti yang diberikan (misal 12/tahun setelah 1th)'
    },
    sisa_cuti: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Sisa cuti yang bisa diambil'
    },
    last_leave_update: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    otp_verified_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    scheduled_deletion_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password_hash) {
                user.password_hash = await bcrypt.hash(user.password_hash, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password_hash')) {
                user.password_hash = await bcrypt.hash(user.password_hash, 10);
            }
        }
    }
});

// Instance method to compare password
User.prototype.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password_hash);
};

// Instance method to hide sensitive data
User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password_hash;
    delete values.face_encoding;
    return values;
};

module.exports = User;
