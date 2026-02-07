const { User, Departemen, Shift, sequelize } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');

// HR/Admin: List all users
exports.getUsers = async (req, res) => {
    try {
        const { search, role, status_aktif, penempatan_store } = req.query;
        const whereClause = {};
        const currentUser = req.user;

        // HR Cabang restriction
        if (currentUser.role === 'hr_cabang') {
            // Force filter to own store
            whereClause.penempatan_store = currentUser.penempatan_store;
        } else if (penempatan_store) {
            // For others, allow filter
            whereClause.penempatan_store = penempatan_store;
        }

        if (search) {
            whereClause[Op.or] = [
                { nama_lengkap: { [Op.iLike]: `%${search}%` } },
                { nik: { [Op.iLike]: `%${search}%` } }
            ];
        }

        if (role) whereClause.role = role;
        if (status_aktif !== undefined) whereClause.status_aktif = status_aktif;

        const users = await User.findAll({
            where: whereClause,
            include: [
                { model: Departemen, as: 'departemen', attributes: ['nama_departemen'] },
                { model: Shift, as: 'shift_default', attributes: ['nama_shift', 'jam_masuk', 'jam_pulang'] },
                { model: User, as: 'atasan', attributes: ['id', 'nama_lengkap', 'nik'] }
            ],
            attributes: { exclude: ['password_hash', 'face_encoding'] },
            order: [['nama_lengkap', 'ASC']]
        });

        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

// HR/Admin: Get single user
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [
                { association: 'departemen' },
                { association: 'shift_default' },
                { association: 'atasan' }
            ],
            attributes: { exclude: ['password_hash', 'face_encoding'] }
        });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // HR Cabang restriction check
        if (req.user.role === 'hr_cabang') {
            if (user.penempatan_store !== req.user.penempatan_store) {
                return res.status(403).json({ success: false, message: 'Akses ditolak: Karyawan berbeda store' });
            }
        }

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

// HR/Admin: Create new user
exports.createUser = async (req, res) => {
    try {
        const userData = req.body;
        const currentUser = req.user;

        console.log('Create User Request:', {
            by: currentUser.id,
            role: currentUser.role,
            creating: userData.nik
        });

        // Basic validation & Sanitization
        const nik = userData.nik?.trim();
        const email = userData.email?.trim()?.toLowerCase();

        if (!nik || !email || !userData.nama_lengkap || !userData.password) {
            return res.status(400).json({ success: false, message: 'Data tidak lengkap (NIK, Email, Nama, Password wajib diisi)' });
        }

        // ... (Store clean values)
        userData.nik = nik;
        userData.email = email;

        // HR Cabang Enforcement
        if (currentUser.role === 'hr_cabang') {
            if (!currentUser.penempatan_store) {
                return res.status(403).json({ success: false, message: 'Akun HR Cabang Anda tidak memiliki data Penempatan Store. Hubungi Admin.' });
            }
            userData.penempatan_store = currentUser.penempatan_store;
        }

        if (userData.atasan_id === '') userData.atasan_id = null;
        if (userData.departemen_id === '') userData.departemen_id = null;
        if (userData.shift_default_id === '') userData.shift_default_id = null;

        const plainPassword = userData.password;

        const newUser = await User.create({
            ...userData,
            password_hash: userData.password
        });

        // SECURITY NOTE: Sending plain text passwords via email is discouraged. 
        // In the next version, consider a "Set Password" link with a secure token.
        setImmediate(async () => {
            try {
                console.log(`📧 [SECURITY-AUDIT] Sending credentials to ${newUser.email}. Requested by: ${currentUser.nik}`);
                await emailService.sendWelcomeEmail(newUser.email, {
                    nama_lengkap: newUser.nama_lengkap,
                    nik: newUser.nik,
                    password: plainPassword,
                    penempatan_store: newUser.penempatan_store
                });
            } catch (emailError) {
                console.error(`❌ Welcome email failed for ${newUser.email}:`, emailError.message);
            }
        });

        res.status(201).json({
            success: true,
            message: 'Karyawan berhasil ditambahkan. Email dengan kredensial login telah dikirim ke ' + newUser.email,
            data: newUser
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, message: 'NIK atau Email sudah terdaftar di sistem' });
        }
        console.error('Create User Error:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

// HR/Admin: Update user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });

        // HR Cabang restriction check
        if (req.user.role === 'hr_cabang') {
            if (user.penempatan_store !== req.user.penempatan_store) {
                return res.status(403).json({ success: false, message: 'Akses ditolak: Tidak dapat mengubah karyawan store lain' });
            }
            // Cannot change store
            if (updateData.penempatan_store && updateData.penempatan_store !== req.user.penempatan_store) {
                return res.status(403).json({ success: false, message: 'Akses ditolak: Anda tidak dapat memindahkan karyawan ke store lain' });
            }
            // Force the store to be the same (prevent accidental removal)
            updateData.penempatan_store = req.user.penempatan_store;
        }

        // Clean up empty strings for optional IDs
        if (updateData.atasan_id === '') updateData.atasan_id = null;
        if (updateData.departemen_id === '') updateData.departemen_id = null;
        if (updateData.shift_default_id === '') updateData.shift_default_id = null;

        // If password is changed, set it to password_hash (hook handles the bcrypt)
        if (updateData.password && updateData.password.trim() !== '') {
            updateData.password_hash = updateData.password;
        } else {
            delete updateData.password;
        }

        // Prevent re-activation of non-active users
        if (user.status_aktif === false && updateData.status_aktif === true) {
            return res.status(400).json({ success: false, message: 'Karyawan yang sudah dinonaktifkan tidak dapat diaktifkan kembali. Silakan daftarkan sebagai karyawan baru.' });
        }

        // Prevent manual modification of deletion schedule
        delete updateData.scheduled_deletion_at;

        await user.update(updateData);
        res.json({ success: true, message: 'Data karyawan berhasil diperbarui', data: user });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, message: 'NIK atau Email sudah digunakan oleh karyawan lain' });
        }
        console.error('Update User Error:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

// HR/Admin: Delete user (Deactivate)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // HR Cabang restriction check
        if (req.user.role === 'hr_cabang') {
            if (user.penempatan_store !== req.user.penempatan_store) {
                return res.status(403).json({ success: false, message: 'Akses ditolak: Tidak dapat mengubah karyawan store lain' });
            }
        }

        user.status_aktif = false;
        user.scheduled_deletion_at = new Date(Date.now() + 30 * 60000); // 30 minutes from now
        await user.save();
        res.json({ success: true, message: 'Karyawan telah dinonaktifkan dan akan dihapus permanen dalam 30 menit.' });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

// Get distinct stores list
exports.getDistinctStores = async (req, res) => {
    try {
        const stores = await User.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('penempatan_store')), 'penempatan_store']],
            where: {
                penempatan_store: { [Op.ne]: null }
            },
            order: [['penempatan_store', 'ASC']],
            raw: true
        });

        const storeList = stores.map(s => s.penempatan_store).filter(s => s && s.trim() !== '');
        res.json({ success: true, data: storeList });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};
