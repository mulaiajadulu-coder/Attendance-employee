const express = require('express');
const router = express.Router();
const { User } = require('../models');
const profileController = require('../controllers/profileController');
const authenticate = require('../middlewares/authenticate');

// All routes here require login
router.use(authenticate);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/request-otp', profileController.requestChangePasswordOtp);
router.post('/verify-otp', profileController.verifyOtpOnly);
router.post('/change-password', profileController.changePasswordAfterVerify);

module.exports = router;
