const jwt = require('jsonwebtoken');
const { User, Jadwal, Shift } = require('../models');
const emailService = require('../services/emailService');
const { Op } = require('sequelize');
const { calculateTenure, updateUserLeave } = require('../utils/userUtils');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, nik: user.nik, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
};

// Generate refresh token
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
};

// Login
exports.login = async (req, res) => {
    try {
        const { nik, password } = req.body;

        // Validation
        if (!nik || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'NIK dan password harus diisi'
                }
            });
        }

        // Find user
        const user = await User.findOne({
            where: { nik },
            include: [
                { association: 'departemen' },
                { association: 'shift_default' },
                { association: 'atasan', attributes: ['id', 'nik', 'nama_lengkap'] }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'NIK atau password salah'
                }
            });
        }

        // Check if user is active
        if (!user.status_aktif) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'ACCOUNT_INACTIVE',
                    message: 'Akun Anda tidak aktif. Hubungi HR.'
                }
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'NIK atau password salah'
                }
            });
        }

        // Generate tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        // Check for today's specific schedule
        const today = new Date().toISOString().split('T')[0];
        const todayJadwal = await Jadwal.findOne({
            where: { user_id: user.id, tanggal: today },
            include: [{ model: Shift, as: 'shift' }]
        });

        // Apply tenure and leave logic
        await updateUserLeave(user);

        const userData = user.toJSON();
        userData.tenure = calculateTenure(user.tanggal_bergabung);

        if (todayJadwal && todayJadwal.shift) {
            userData.current_shift = todayJadwal.shift;
            userData.is_scheduled = true;
        } else {
            userData.current_shift = user.shift_default;
            userData.is_scheduled = false;
        }

        // Return success response
        res.json({
            success: true,
            data: {
                token,
                refreshToken,
                user: userData
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: error.message
            }
        });
    }
};

// Get current user
exports.me = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Re-fetch user to get latest shift info if needed, or just use req.user
        // req.user already has shift_default from middleware. 
        // But we need to check Jadwal for today.
        const todayJadwal = await Jadwal.findOne({
            where: { user_id: req.user.id, tanggal: today },
            include: [{ model: Shift, as: 'shift' }]
        });

        // Apply tenure and leave logic
        await updateUserLeave(req.user);

        const userData = req.user.toJSON();
        userData.tenure = calculateTenure(req.user.tanggal_bergabung);

        if (todayJadwal && todayJadwal.shift) {
            userData.current_shift = todayJadwal.shift;
            userData.is_scheduled = true;
        } else {
            userData.current_shift = req.user.shift_default;
            userData.is_scheduled = false;
        }

        res.json({
            success: true,
            data: userData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: error.message
            }
        });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { old_password, new_password, confirm_password } = req.body;

        // Validation
        if (!old_password || !new_password || !confirm_password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Semua field harus diisi'
                }
            });
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Password baru dan konfirmasi password tidak cocok'
                }
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Password minimal 6 karakter'
                }
            });
        }

        // Get user with password
        const user = await User.scope('withPassword').findByPk(req.user.id);

        // Verify old password
        const isOldPasswordValid = await user.comparePassword(old_password);
        if (!isOldPasswordValid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_PASSWORD',
                    message: 'Password lama salah'
                }
            });
        }

        // Update password
        user.password_hash = new_password;
        await user.save();

        res.json({
            success: true,
            message: 'Password berhasil diubah'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: error.message
            }
        });
    }
};

// Refresh token
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Refresh token harus diisi'
                }
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Get user
        const user = await User.findByPk(decoded.id);
        if (!user || !user.status_aktif) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User tidak valid'
                }
            });
        }

        // Generate new tokens
        const newToken = generateToken(user);
        const newRefreshToken = generateRefreshToken(user);

        res.json({
            success: true,
            data: {
                token: newToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Refresh token invalid atau expired'
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: error.message
            }
        });
    }
};

// Request OTP (Forgot Password)
exports.requestOTP = async (req, res) => {
    try {
        const { identifier } = req.body; // can be NIK or Email

        if (!identifier) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'NIK atau Email harus diisi' }
            });
        }

        const user = await User.findOne({
            where: {
                [Op.or]: [{ nik: identifier }, { email: identifier }]
            }
        });

        if (!user) {
            // Safety: Don't reveal if user exists or not
            return res.json({
                success: true,
                message: 'Jika akun terdaftar, kode OTP akan dikirim ke email Anda'
            });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes from now

        // Save to DB
        user.otp_code = otp;
        user.otp_expires_at = expiresAt;
        await user.save();

        // Send Email
        const emailSent = await emailService.sendOTP(user.email, otp);

        res.json({
            success: true,
            message: 'Kode OTP telah dikirim ke email Anda'
        });

    } catch (error) {
        console.error('Request OTP Error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        if (!identifier || !otp) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'NIK/Email dan OTP harus diisi' }
            });
        }

        const user = await User.findOne({
            where: {
                [Op.or]: [{ nik: identifier }, { email: identifier }],
                otp_code: otp,
                otp_expires_at: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_OTP', message: 'Kode OTP salah atau sudah kedaluwarsa' }
            });
        }

        res.json({
            success: true,
            message: 'OTP valid, silakan lanjutkan reset password'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// Reset Password with OTP
exports.resetPassword = async (req, res) => {
    try {
        const { identifier, otp, new_password, confirm_password } = req.body;

        if (new_password !== confirm_password) {
            return res.status(400).json({
                success: false,
                error: { message: 'Konfirmasi password tidak cocok' }
            });
        }

        const user = await User.findOne({
            where: {
                [Op.or]: [{ nik: identifier }, { email: identifier }],
                otp_code: otp,
                otp_expires_at: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_OTP', message: 'Sesi reset password tidak valid atau sudah expired' }
            });
        }

        // Update password & clear OTP
        user.password_hash = new_password;
        user.otp_code = null;
        user.otp_expires_at = null;
        await user.save();

        res.json({
            success: true,
            message: 'Password berhasil diperbarui. Silakan login kembali.'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};
