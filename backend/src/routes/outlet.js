const express = require('express');
const router = express.Router();
const outletController = require('../controllers/outletController');
const authenticateToken = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

const isAdmin = authorize('admin', 'hr');

// Public/User Routes (Authenticated)
router.get('/nearby', authenticateToken, outletController.getNearbyOutlets);
router.get('/', authenticateToken, outletController.getAllOutlets); // Used for dropdowns etc

// Admin Routes
router.post('/', authenticateToken, isAdmin, outletController.createOutlet);
router.put('/:id', authenticateToken, isAdmin, outletController.updateOutlet);
router.delete('/:id', authenticateToken, isAdmin, outletController.deleteOutlet);

module.exports = router;
