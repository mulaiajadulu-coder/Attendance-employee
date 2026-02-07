const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');
const rateLimit = require('express-rate-limit');

// Strict limiter for login and sensitive auth actions
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        success: false,
        error: { code: 'TOO_MANY_REQUESTS', message: 'Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.' }
    }
});

// Public routes
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authLimiter, authController.requestOTP);
router.post('/verify-otp', authLimiter, authController.verifyOTP);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.me);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
