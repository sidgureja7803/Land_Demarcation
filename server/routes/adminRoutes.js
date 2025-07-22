const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin access
router.use(authenticateToken);
router.use(isAdmin);

// Admin dashboard statistics
router.get('/stats', adminController.getStats);

// Plot status distribution for charts
router.get('/status-distribution', adminController.getStatusDistribution);

// Circle-wise plot distribution for charts
router.get('/circle-distribution', adminController.getCircleDistribution);

// Village-wise plot distribution for charts
router.get('/village-distribution', adminController.getVillageDistribution);

// Officer performance data
router.get('/officer-performance', adminController.getOfficerPerformance);

// Generate and download reports
router.get('/reports', adminController.generateReport);

module.exports = router;
