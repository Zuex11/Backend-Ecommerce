const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  removeFromCart,
  emptyCart,
  importCart,
  confirmProduct
} = require('../controllers/cart.controller');

const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', authenticate, getCart);
router.post('/import', authenticate, importCart);
router.post('/', authenticate, addToCart);
router.delete('/', authenticate, emptyCart);
router.delete('/:productId', authenticate, removeFromCart);
router.put('/confirm', authenticate, confirmProduct);

module.exports = router;
