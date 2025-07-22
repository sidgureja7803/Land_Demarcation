import express from 'express';
import { citizenController } from '../../controllers/citizen/citizenController';
import { isAuthenticated, isCitizen } from '../../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/signup', citizenController.signup);
router.post('/login', citizenController.login);
router.post('/logout', citizenController.logout);

// Protected citizen routes
router.get('/me', isAuthenticated, isCitizen, citizenController.getCurrentUser);
router.put('/profile', isAuthenticated, isCitizen, citizenController.updateProfile);
router.post('/change-password', isAuthenticated, isCitizen, citizenController.changePassword);

export default router;
