const express = require('express');
const router = express.Router();
const koreksiController = require('../controllers/koreksiController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

// User mengajukan koreksi
router.post('/request', authenticateToken, koreksiController.createRequest);

// User melihat riwayat pengajuan koreksi mereka
router.get('/my-requests', authenticateToken, koreksiController.getMyRequests);

// Atasan/HR melihat daftar approval
router.get('/approvals', authenticateToken, authorizeRole(['hr', 'manager', 'supervisor', 'admin', 'area_manager', 'general_manager']), koreksiController.getApprovals);

// Atasan/HR melakukan aksi approve/reject
router.post('/validate/:id', authenticateToken, authorizeRole(['hr', 'manager', 'supervisor', 'admin', 'area_manager', 'general_manager']), koreksiController.validateRequest);

module.exports = router;
