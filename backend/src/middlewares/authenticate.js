const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Token tidak ditemukan'
                }
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await User.findByPk(decoded.id, {
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
                    code: 'UNAUTHORIZED',
                    message: 'User tidak ditemukan'
                }
            });
        }

        if (!user.status_aktif) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Akun tidak aktif'
                }
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Token invalid'
                }
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Token expired'
                }
            });
        }

        return res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: error.message
            }
        });
    }
};

module.exports = authenticate;
