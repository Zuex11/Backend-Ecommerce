const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const {
  getAllSubcategories,
  getActiveSubcategories,
  getSubcategoryBySlug,
  createSubcategory,
  updateSubcategory,
} = require('../controllers/subcategory.controller');

router.post('/create', authenticate, authorize('admin'), createSubcategory);
router.get('/admin', authenticate, authorize('admin'), getAllSubcategories);
router.get('/', getActiveSubcategories);
router.get('/:slug', getSubcategoryBySlug);
router.patch('/:slug', authenticate, authorize('admin'), updateSubcategory);

module.exports = router;
