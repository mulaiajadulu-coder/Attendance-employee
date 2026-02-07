const express = require('express');
const router = express.Router();
const jadwalController = require('../controllers/jadwalController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/' });

router.use(authenticate);

// Publicly accessible for all authenticated employees
router.get('/my-schedule', jadwalController.getMyJadwalByDate);

// Restricted to HR/Admin
router.get('/template', authorize('hr', 'hr_cabang', 'admin'), jadwalController.getTemplateJadwal);
router.post('/upload', authorize('hr', 'hr_cabang', 'admin'), upload.single('file'), jadwalController.uploadBulkJadwal);
router.get('/', authorize('hr', 'hr_cabang', 'admin'), jadwalController.getJadwalByStore);

module.exports = router;
