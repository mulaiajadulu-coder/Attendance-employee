const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

router.use(authenticate);

// Admin & HR can manage shifts
router.get('/', shiftController.getAllShifts);
router.post('/', authorize('admin', 'hr'), shiftController.createShift);
router.put('/:id', authorize('admin', 'hr'), shiftController.updateShift);
router.delete('/:id', authorize('admin', 'hr'), shiftController.deleteShift);

module.exports = router;
