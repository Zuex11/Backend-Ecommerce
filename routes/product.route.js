const express = require('express');
const router = express.Router();
const {upload} = require('../middlewares/upload.middleware')
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const {
  getAllProducts,
  getActiveProducts,
  getProductBySlug,
  getRelatedProducts,
  createProduct,
  updateProduct,
} = require('../controllers/product.controller');


router.post('/create', authenticate, authorize('admin'), upload.array('imgURL', 4), createProduct);
router.get('/admin', authenticate, authorize('admin'), getAllProducts);
router.get('/', getActiveProducts);
router.get('/related/:slug', getRelatedProducts);
router.get('/:slug', getProductBySlug);
router.patch('/:slug', authenticate, authorize('admin'), upload.array('imgURL', 4), updateProduct);

module.exports = router;
