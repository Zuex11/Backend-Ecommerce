const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  editAdmin,
  editUser,
  getProfile,
} = require('../controllers/user.controller');
const {
  addAddress,
  editAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/address.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
router.post('/signup', createUser('user'));
router.get('/admin', authenticate, authorize('admin'), getAllUsers);
router.get('/me', authenticate, getProfile);
router.post('/admin', authenticate, authorize('admin'), createUser('admin'));
router.patch('/admin/:id', authenticate, authorize('admin'), editAdmin);
router.patch('/edit', authenticate, editUser);
router.post('/address', authenticate, addAddress);
router.patch('/address/:addressId', authenticate, editAddress);
router.delete('/address/:addressId', authenticate, deleteAddress);
router.patch('/address/:addressId/default', authenticate, setDefaultAddress);
module.exports = router;
