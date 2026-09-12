const express = require('express');
const router = express.Router();
const { getDashboardReport } = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.get('/dashboard', authenticate, authorize('admin'), getDashboardReport);

module.exports = router;
