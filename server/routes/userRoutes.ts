import express from 'express';
import { userController } from '../controllers/userController';
import { isAuthenticated, hasRole } from '../middleware/shared/authMiddleware';

const router = express.Router();

// Public routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// Protected routes - require authentication
router.get('/me', isAuthenticated, userController.getCurrentUser);
router.patch('/me', isAuthenticated, userController.updateProfile);
router.post('/change-password', isAuthenticated, userController.changePassword);

// Admin routes - require admin role
router.get('/all', isAuthenticated, hasRole('admin'), userController.getAllUsers);
router.patch('/:userId/status', isAuthenticated, hasRole('admin'), userController.toggleUserStatus);

export default router;
