const express = require('express');
const router = express.Router();
const koreksiController = require('../controllers/koreksiController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Apply authentication middleware to all routes
router.use(authenticate);

// User mengajukan koreksi
router.post('/request', koreksiController.createRequest);

// User melihat riwayat pengajuan koreksi mereka
router.get('/my-requests', koreksiController.getMyRequests);

// Atasan/HR melihat daftar approval
router.get('/approvals', authorize('hr', 'manager', 'supervisor', 'admin', 'area_manager', 'general_manager'), koreksiController.getApprovals);

// Atasan/HR melakukan aksi approve/reject
router.post('/validate/:id', authorize('hr', 'manager', 'supervisor', 'admin', 'area_manager', 'general_manager'), koreksiController.validateRequest);

module.exports = router;
