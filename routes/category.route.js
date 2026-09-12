const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const {
  getAllCategories,
  getActiveCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
} = require('../controllers/category.controller');

router.post('/create', authenticate, authorize('admin'), createCategory);
router.get('/admin', authenticate, authorize('admin'), getAllCategories);
router.get('/', getActiveCategories);
router.get('/:slug', getCategoryBySlug);
router.patch('/:slug', authenticate, authorize('admin'), updateCategory);

module.exports = router;
