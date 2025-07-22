import { Request, Response } from 'express';
import { db } from '../../db';
import { plots, demarcationLogs, users } from '../../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export const citizenPlotController = {
  // Get plots owned by the current citizen
  getMyPlots: async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const userPlots = await db.select()
        .from(plots)
        .where(eq(plots.ownerId, userId))
        .orderBy(desc(plots.createdAt));
      
      return res.status(200).json({
        success: true,
        plots: userPlots
      });
    } catch (error) {
      console.error('Error fetching citizen plots:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching plots'
      });
    }
  },
  
  // Get a specific plot by ID (only if owned by the current citizen)
  getPlotById: async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      const plotId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      if (!plotId) {
        return res.status(400).json({
          success: false,
          message: 'Plot ID is required'
        });
      }
      
      const plotResult = await db.select()
        .from(plots)
        .where(and(
          eq(plots.id, plotId),
          eq(plots.ownerId, userId)
        ));
      
      if (plotResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Plot not found or you do not have access'
        });
      }
      
      const plot = plotResult[0];
      
      return res.status(200).json({
        success: true,
        plot
      });
    } catch (error) {
      console.error('Error fetching citizen plot by ID:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching plot'
      });
    }
  },
  
  // Get demarcation logs for a specific plot (only if owned by the current citizen)
  getPlotLogs: async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      const plotId = req.params.plotId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      if (!plotId) {
        return res.status(400).json({
          success: false,
          message: 'Plot ID is required'
        });
      }
      
      // First verify the plot belongs to this citizen
      const plotResult = await db.select()
        .from(plots)
        .where(and(
          eq(plots.id, plotId),
          eq(plots.ownerId, userId)
        ));
      
      if (plotResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Plot not found or you do not have access'
        });
      }
      
      // Get logs for this plot
      const logs = await db.select({
        log: demarcationLogs,
        officerName: users.name
      })
        .from(demarcationLogs)
        .leftJoin(users, eq(demarcationLogs.officerId, users.id))
        .where(eq(demarcationLogs.plotId, plotId))
        .orderBy(desc(demarcationLogs.createdAt));
      
      return res.status(200).json({
        success: true,
        logs
      });
    } catch (error) {
      console.error('Error fetching citizen plot logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching plot logs'
      });
    }
  },
  
  // Create a new demarcation request for a plot
  createDemarcationRequest: async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      const { 
        khasraNumber, 
        village, 
        size, 
        requestType, 
        description, 
        latitude, 
        longitude,
        villageName,
        circleName
      } = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Validate required fields
      if (!khasraNumber || !village || !size || !requestType) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      // Create new plot with citizen as owner
      const newPlot = {
        khasraNumber,
        village,
        size,
        status: 'pending',
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        latitude,
        longitude,
        villageName,
        circleName
      };
      
      const insertResult = await db.insert(plots)
        .values(newPlot)
        .returning();
      
      if (insertResult.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create demarcation request'
        });
      }
      
      const plot = insertResult[0];
      
      // Create initial log entry for the request
      const logEntry = {
        plotId: plot.id,
        status: 'pending',
        description: description || 'Demarcation request submitted',
        officerId: null,
        createdAt: new Date(),
        requestType
      };
      
      await db.insert(demarcationLogs)
        .values(logEntry);
      
      return res.status(201).json({
        success: true,
        message: 'Demarcation request created successfully',
        plot
      });
    } catch (error) {
      console.error('Error creating citizen demarcation request:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error creating demarcation request'
      });
    }
  },
  
  // Get plot status statistics for the citizen
  getPlotStats: async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Count plots by status
      const pendingCount = await db
        .select({ count: sql`count(*)` })
        .from(plots)
        .where(and(
          eq(plots.ownerId, userId),
          eq(plots.status, 'pending')
        ));
      
      const inProgressCount = await db
        .select({ count: sql`count(*)` })
        .from(plots)
        .where(and(
          eq(plots.ownerId, userId),
          eq(plots.status, 'in_progress')
        ));
      
      const completedCount = await db
        .select({ count: sql`count(*)` })
        .from(plots)
        .where(and(
          eq(plots.ownerId, userId),
          eq(plots.status, 'completed')
        ));
      
      const rejectedCount = await db
        .select({ count: sql`count(*)` })
        .from(plots)
        .where(and(
          eq(plots.ownerId, userId),
          eq(plots.status, 'rejected')
        ));
      
      // Get total number of plots
      const totalCount = await db
        .select({ count: sql`count(*)` })
        .from(plots)
        .where(eq(plots.ownerId, userId));
      
      return res.status(200).json({
        success: true,
        stats: {
          pending: pendingCount[0]?.count || 0,
          in_progress: inProgressCount[0]?.count || 0,
          completed: completedCount[0]?.count || 0,
          rejected: rejectedCount[0]?.count || 0,
          total: totalCount[0]?.count || 0
        }
      });
    } catch (error) {
      console.error('Error fetching citizen plot stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching plot statistics'
      });
    }
  }
};
