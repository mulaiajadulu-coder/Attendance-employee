const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// All routes here require login and HR/Admin privilege
router.use(authenticate);
router.use(authorize('hr', 'hr_cabang', 'admin'));

router.get('/stores', userController.getDistinctStores);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
