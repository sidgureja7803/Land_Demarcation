import express from 'express';
import { db } from '../../db';
import { plots, demarcationLogs } from '../../../shared/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { isAuthenticated } from '../../middleware/shared/authMiddleware';

const router = express.Router();

// Get all plots
router.get('/plots', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    const userRole = req.session?.userRole || 'citizen';
    let plotData;
    
    // If user is citizen, only return their plots
    if (userRole === 'citizen') {
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
    const userId = req.session?.userId;
    const userRole = req.session?.userRole || 'citizen';
    
    const plotData = await db.select()
      .from(plots)
      .where(eq(plots.id, Number(id)))
      .limit(1);
    
    if (plotData.length === 0) {
      return res.status(404).json({ error: 'Plot not found' });
    }
    
    const plot = plotData[0];
    
    // Check permissions - citizens can only view their own plots
    if (userRole === 'citizen' && plot.ownerId !== userId) {
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
      area: plot.area,
      status: latestLog.length > 0 ? latestLog[0].currentStatus : 'pending',
      lastUpdated: latestLog.length > 0 ? latestLog[0].updatedAt.toISOString() : plot.createdAt.toISOString(),
      villageName: plot.villageName,
      circleName: plot.circleName,
      district: plot.district
    };
    
    res.json(plotWithStatus);
  } catch (error) {
    console.error('Error fetching plot details:', error);
    res.status(500).json({ error: 'Failed to fetch plot details' });
  }
});

// Get all plot locations for map view
router.get('/plots/map-locations', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    const userRole = req.session?.userRole || 'citizen';
    let plotData;
    
    // If user is citizen, only return their plots
    if (userRole === 'citizen') {
      plotData = await db.select({
        id: plots.id,
        plotId: plots.plotId,
        latitude: plots.latitude,
        longitude: plots.longitude,
        status: sql<string>`COALESCE((SELECT status FROM demarcation_logs WHERE plot_id = plots.id ORDER BY created_at DESC LIMIT 1), 'pending')`
      })
      .from(plots)
      .where(eq(plots.ownerId, userId));
    } else {
      // For officers and admins, return all plots
      plotData = await db.select({
        id: plots.id,
        plotId: plots.plotId,
        latitude: plots.latitude,
        longitude: plots.longitude,
        status: sql<string>`COALESCE((SELECT status FROM demarcation_logs WHERE plot_id = plots.id ORDER BY created_at DESC LIMIT 1), 'pending')`
      })
      .from(plots);
    }
    
    res.json(plotData);
  } catch (error) {
    console.error('Error fetching plot locations:', error);
    res.status(500).json({ error: 'Failed to fetch plot locations' });
  }
});

export default router;
