const express = require('express');
const router = express.Router();
const absensiController = require('../controllers/absensiController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// All routes require authentication
router.use(authenticate);

// Absensi Actions
router.post('/masuk', absensiController.checkIn);
router.post('/pulang', absensiController.checkOut);

// Data Retrieval
router.get('/today', absensiController.getTodayStatus);
router.get('/history', absensiController.getHistory);
router.get('/monitoring', authorize('hr', 'admin', 'supervisor', 'area_manager', 'manager', 'hr_cabang'), absensiController.getMonitoring);
router.get('/analytics', absensiController.getAnalytics);
// Manual entry endpoint for managers/hr/admin to create check-in/out without photo (for missed punches)
router.post('/manual', authorize('hr', 'admin', 'supervisor', 'manager', 'area_manager'), absensiController.adminManualEntry);

module.exports = router;
