import express from 'express';
import { db } from '../db';
import { plots, demarcationLogs } from '../../../shared/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { isAuthenticated } from '../middlewares/auth';

const router = express.Router();

// Get all plots
router.get('/plots', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.userType || 'citizen';
    let plotData;
    
    // If user is citizen, only return their plots
    if (userType === 'citizen') {
      plotData = await db.select()
        .from(plots)
        .where(eq(plots.ownerId, userId))
        .orderBy(desc(plots.createdAt));
    } else {
      // For officers and admins, return all plots
      plotData = await db.select()
        .from(plots)
        .orderBy(desc(plots.createdAt));
    }

    // For each plot, get the latest status from demarcation logs
    const plotsWithStatus = await Promise.all(plotData.map(async (plot) => {
      // Get the latest log entry for this plot to determine status
      const latestLog = await db.select({
        currentStatus: demarcationLogs.status,
        updatedAt: demarcationLogs.createdAt
      })
      .from(demarcationLogs)
      .where(eq(demarcationLogs.plotId, plot.id))
      .orderBy(desc(demarcationLogs.createdAt))
      .limit(1);

      // Convert DB model to API model with coordinates
      return {
        id: plot.id,
        plotId: plot.plotId,
        ownerName: plot.ownerName,
        latitude: plot.latitude,
        longitude: plot.longitude,
        status: latestLog.length > 0 ? latestLog[0].currentStatus : 'pending',
        villageName: plot.villageName,
        circleName: plot.circleName,
        area: plot.area,
        lastUpdated: latestLog.length > 0 ? latestLog[0].updatedAt.toISOString() : plot.createdAt.toISOString()
      };
    }));

    res.json(plotsWithStatus);
  } catch (error) {
    console.error('Error fetching plots:', error);
    res.status(500).json({ error: 'Failed to fetch plots' });
  }
});

// Get a specific plot by ID
router.get('/plots/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userType = req.user?.userType || 'citizen';
    
    const plotData = await db.select()
      .from(plots)
      .where(eq(plots.id, Number(id)))
      .limit(1);
    
    if (plotData.length === 0) {
      return res.status(404).json({ error: 'Plot not found' });
    }
    
    const plot = plotData[0];
    
    // Check permissions - citizens can only view their own plots
    if (userType === 'citizen' && plot.ownerId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this plot' });
    }
    
    // Get the latest log entry for this plot to determine status
    const latestLog = await db.select({
      currentStatus: demarcationLogs.status,
      updatedAt: demarcationLogs.createdAt
    })
    .from(demarcationLogs)
    .where(eq(demarcationLogs.plotId, plot.id))
    .orderBy(desc(demarcationLogs.createdAt))
    .limit(1);
    
    // Convert DB model to API model with coordinates
    const plotWithStatus = {
      id: plot.id,
      plotId: plot.plotId,
      ownerName: plot.ownerName,
      latitude: plot.latitude,
      longitude: plot.longitude,
      status: latestLog.length > 0 ? latestLog[0].currentStatus : 'pending',
      villageName: plot.villageName,
      circleName: plot.circleName,
      area: plot.area,
      lastUpdated: latestLog.length > 0 ? latestLog[0].updatedAt.toISOString() : plot.createdAt.toISOString()
    };
    
    res.json(plotWithStatus);
  } catch (error) {
    console.error('Error fetching plot:', error);
    res.status(500).json({ error: 'Failed to fetch plot' });
  }
});

export default router;
