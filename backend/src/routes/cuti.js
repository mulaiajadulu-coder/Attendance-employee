const express = require('express');
const router = express.Router();
const cutiController = require('../controllers/cutiController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

router.use(authenticate);

// Karyawan
router.post('/apply', cutiController.applyCuti);
router.get('/my-history', cutiController.getMyHistory);

// Atasan / HR
router.get('/approvals', authorize('hr', 'admin', 'supervisor', 'area_manager'), cutiController.getApprovalList);
router.post('/validate/:id', authorize('hr', 'admin', 'supervisor', 'area_manager'), cutiController.validateCuti);

module.exports = router;
