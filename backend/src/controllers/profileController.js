const { User, Jadwal, Shift, sequelize } = require('../models');
const { calculateTenure, updateUserLeave } = require('../utils/userUtils');
const emailService = require('../services/emailService');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const saveBase64Image = (base64String, subDir = 'profiles') => {
    try {
        const isVercel = process.env.VERCEL === '1';
        const rootDir = isVercel ? '/tmp' : path.join(__dirname, '../../uploads');
        const uploadDir = path.join(rootDir, subDir);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        // Remove header and validate mime type
        const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return null;

        const mimeType = matches[1];
        const base64Data = matches[2];
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!allowedMimeTypes.includes(mimeType)) return null;

        const extension = mimeType.split('/')[1];
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, base64Data, 'base64');

        return isVercel ? `tmp/${subDir}/${fileName}` : `uploads/${subDir}/${fileName}`;
    } catch (error) {
        console.error('Save Image Error:', error);
        return null;
    }
};

exports.getProfile = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash', 'otp_code', 'otp_expires_at', 'face_encoding'] },
            include: [
                { association: 'departemen' },
                { association: 'shift_default' }
            ]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        // Apply tenure and leave logic
        await updateUserLeave(user);

        // Check for today's specific schedule
        const todayJadwal = await Jadwal.findOne({
            where: { user_id: req.user.id, tanggal: today },
            include: [{ model: Shift, as: 'shift' }]
        });

        const userData = user.toJSON();
        userData.tenure = calculateTenure(user.tanggal_bergabung);

        // If there is a schedule for today, override the shift_default for display
        if (todayJadwal && todayJadwal.shift) {
            userData.current_shift = todayJadwal.shift;
            userData.is_scheduled = true;
        } else {
            userData.current_shift = user.shift_default;
            userData.is_scheduled = false;
        }

        res.json({ success: true, data: userData });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { email, no_hp, foto_profil, nama_lengkap, nik, penempatan_store } = req.body;
        const user = await User.findByPk(req.user.id);

        const isHR = req.user.role === 'hr' || req.user.role === 'admin';

        if (email !== undefined) user.email = email;
        if (no_hp !== undefined) user.no_hp = no_hp;
        if (nama_lengkap !== undefined) user.nama_lengkap = nama_lengkap;

        // Only HR or Admin can change NIK or Penempatan Store
        if (nik !== undefined && isHR) {
            user.nik = nik;
        }

        if (penempatan_store !== undefined && isHR) {
            user.penempatan_store = penempatan_store;
        }

        if (foto_profil && foto_profil.startsWith('data:image')) {
            const fotoUrl = saveBase64Image(foto_profil);
            if (fotoUrl) user.foto_profil_url = fotoUrl;
        }
        await user.save();
        res.json({ success: true, message: 'Profil diperbarui', data: user });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, message: 'NIK atau Email sudah digunakan' });
        }
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

exports.requestChangePasswordOtp = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp_code = otp;
        user.otp_expires_at = new Date(Date.now() + 10 * 60000);
        await user.save();
        await emailService.sendEmail(user.email, 'OTP Ganti Password', `Kode OTP: ${otp}`);
        res.json({ success: true, message: 'OTP terkirim ke email' });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Gagal kirim OTP' } });
    }
};

exports.verifyOtpOnly = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user.otp_code || new Date() > user.otp_expires_at || user.otp_code !== otp) {
            return res.status(400).json({ success: false, error: { message: 'OTP tidak valid atau kadaluarsa' } });
        }

        // Mark as verified
        user.otp_verified_at = new Date();
        await user.save();

        res.json({ success: true, message: 'OTP valid, silakan masukkan password baru' });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

exports.changePasswordAfterVerify = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const user = await User.findByPk(req.user.id);

        // Check if OTP was verified within the last 10 minutes
        const now = new Date();
        const verifiedAt = user.otp_verified_at ? new Date(user.otp_verified_at) : null;

        if (!verifiedAt || (now - verifiedAt) > 10 * 60000) {
            return res.status(401).json({
                success: false,
                error: { message: 'Sesi verifikasi habis atau belum melakukan verifikasi OTP. Silakan ulangi proses.' }
            });
        }

        user.password_hash = newPassword;
        user.otp_code = null;
        user.otp_expires_at = null;
        user.otp_verified_at = null; // Reset verification status
        await user.save();

        res.json({ success: true, message: 'Password berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};
