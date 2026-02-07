const express = require('express');
const router = express.Router();
const controller = require('../controllers/shiftChangeController');
const authenticate = require('../middlewares/authenticate');

router.use(authenticate);

router.post('/request', controller.createRequest);
router.get('/my-requests', controller.getMyRequests);
router.get('/approval-list', controller.getRequestsToApprove);
router.put('/:id/respond', controller.respondRequest);

module.exports = router;
