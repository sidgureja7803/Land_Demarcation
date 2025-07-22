import express from 'express';
import { officerController } from '../../controllers/officer/officerController';
import { isAuthenticated, isOfficerOrADC, isAdmin } from '../../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/signup', officerController.signup);
router.post('/login', officerController.login);
router.post('/logout', officerController.logout);

// Protected officer routes
router.get('/me', isAuthenticated, isOfficerOrADC, officerController.getCurrentUser);
router.put('/profile', isAuthenticated, isOfficerOrADC, officerController.updateProfile);
router.post('/change-password', isAuthenticated, isOfficerOrADC, officerController.changePassword);

// Admin-only routes (for admin dashboard)
router.get('/all', isAuthenticated, isAdmin, officerController.getAllOfficers);

export default router;
