const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const announcementController = require('../controllers/announcementController');
const authenticate = require('../middlewares/authenticate');

router.use(authenticate);

// Notifications
router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markRead);
router.put('/read-all', notificationController.markAllRead);

// Announcements
router.get('/announcements', announcementController.getAnnouncements);
router.post('/announcements', announcementController.createAnnouncement);
router.delete('/announcements/:id', announcementController.deleteAnnouncement);

module.exports = router;