const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const {
  upsertTestimonial,
  deleteTestimonial,
  getAllTestimonials,
  getApprovedTestimonials,
  getUnapprovedTestimonials,
  approveTestimonial
} = require('../controllers/testimonials.controller');

router.get('/', getApprovedTestimonials);
router.put('/', authenticate, upsertTestimonial);
router.delete('/', authenticate, deleteTestimonial);
router.get('/admin', authenticate, authorize('admin'), getAllTestimonials);
router.get('/admin/pending', authenticate, authorize('admin'), getUnapprovedTestimonials);
router.patch('/admin/:testimonialId/approve', authenticate, authorize('admin'), approveTestimonial);
module.exports = router;
