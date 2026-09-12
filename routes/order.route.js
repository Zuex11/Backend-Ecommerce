const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const {
  getAllOrders,
  getUserOrders,
  adminGetUserOrder,
  adminGetOrder,
  adminUpdateOrderStatus,
  createOrder,
  cancelOrder,
  getUserOrder
} = require('../controllers/order.controller');

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getUserOrders);
router.patch('/:orderId', authenticate, cancelOrder);
router.get('/admin', authenticate, authorize('admin'), getAllOrders);
router.get('/admin/order/:orderId', authenticate, authorize('admin'), adminGetOrder);
router.get('/admin/:id', authenticate, authorize('admin'), adminGetUserOrder);
router.get('/:orderId', authenticate, getUserOrder);
router.patch('/admin/:orderId', authenticate, authorize('admin'), adminUpdateOrderStatus);

module.exports = router;
