import express from 'express';
import { officerPlotController } from '../../controllers/officer/plotController';
import { isAuthenticated, isOfficerOrADC, isADC } from '../../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication and officer/ADC role
router.use(isAuthenticated, isOfficerOrADC);

// Get all plots (filtered by circle for regular officers)
router.get('/', officerPlotController.getAllPlots);

// Get plots assigned to current officer
router.get('/my-assigned', officerPlotController.getMyAssignedPlots);

// Get plot statistics for officer dashboard
router.get('/stats/dashboard', officerPlotController.getPlotStats);

// Get a specific plot by ID
router.get('/:id', officerPlotController.getPlotById);

// Update a plot's status
router.put('/:id/status', officerPlotController.updatePlotStatus);

// Assign plot to an officer (ADC only)
router.post('/assign', isADC, officerPlotController.assignPlot);

export default router;
