import express from 'express';
import { citizenPlotController } from '../../controllers/citizen/plotController';
import { isAuthenticated, isCitizen } from '../../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication and citizen role
router.use(isAuthenticated, isCitizen);

// Get all plots owned by the citizen
router.get('/my-plots', citizenPlotController.getMyPlots);

// Get a specific plot by ID (only if owned by the citizen)
router.get('/:id', citizenPlotController.getPlotById);

// Get logs for a specific plot
router.get('/:plotId/logs', citizenPlotController.getPlotLogs);

// Create a new demarcation request
router.post('/', citizenPlotController.createDemarcationRequest);

// Get plot statistics for citizen dashboard
router.get('/stats/dashboard', citizenPlotController.getPlotStats);

export default router;
