import express from 'express';
import { userController } from '../controllers/userController';
import { authenticateUser, checkRole } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// Protected routes - require authentication
router.get('/me', authenticateUser, userController.getCurrentUser);
router.patch('/me', authenticateUser, userController.updateProfile);
router.post('/change-password', authenticateUser, userController.changePassword);

// Admin routes - require admin role
router.get('/all', authenticateUser, checkRole(['admin']), userController.getAllUsers);
router.patch('/:userId/status', authenticateUser, checkRole(['admin']), userController.toggleUserStatus);

export default router;
