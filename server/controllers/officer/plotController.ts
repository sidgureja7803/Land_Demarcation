import { Request, Response } from 'express';
import { db } from '../../db';
import { plots, demarcationLogs, users } from '../../../shared/schema';
import { eq, and, desc, sql, or, inArray } from 'drizzle-orm';

export const officerPlotController = {
  // Get all plots (filtered by circle for regular officers)
  getAllPlots: async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      const userRole = req.session?.userRole;
      const status = req.query.status as string | undefined;
      const circleId = req.query.circleId as string | undefined;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Get officer details to check their assigned circle
      const officerResult = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (officerResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Officer record not found'
        });
      }
      
      const officer = officerResult[0];
      
      // Build query based on user role and filters
      let query = db.select({
        plot: plots,
        ownerName: users.name
      })
        .from(plots)
        .leftJoin(users, eq(plots.ownerId, users.id))
        .orderBy(desc(plots.createdAt));
      
      // Apply filters
      const conditions = [];
      
      // Filter by status if provided
      if (status && status !== 'all') {
        conditions.push(eq(plots.status, status));
      }
      
      // Filter by circle for regular officers (ADC can see all)
      if (userRole === 'officer' && officer.circleId) {
        conditions.push(eq(plots.circleId, officer.circleId));
      } else if (circleId) {
        // ADC can filter by circle if they want
        conditions.push(eq(plots.circleId, circleId));
      }
      
      // Apply all filters if there are any
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const results = await query;
      
      return res.status(200).json({
        success: true,
        plots: results
      });
    } catch (error) {
      console.error('Error fetching plots for officer:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching plots'
      });
    }
  },
  
  // Get a specific plot by ID (with officer permissions)
  getPlotById: async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      const userRole = req.session?.userRole;
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
      
      // Get officer details to check their assigned circle
      const officerResult = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (officerResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Officer record not found'
        });
      }
      
      const officer = officerResult[0];
      
      // Get the plot
      const plotResult = await db.select({
        plot: plots,
        ownerName: users.name,
        ownerEmail: users.email,
        ownerPhone: users.phoneNumber,
        ownerAddress: users.address,
        ownerAadhaar: users.aadhaarNumber
      })
        .from(plots)
        .leftJoin(users, eq(plots.ownerId, users.id))
        .where(eq(plots.id, plotId));
      
      if (plotResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Plot not found'
        });
      }
      
      const plotData = plotResult[0];
      
      // Check if officer has access to this plot
      if (userRole === 'officer' && officer.circleId && plotData.plot.circleId !== officer.circleId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to plots outside your assigned circle'
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
        plot: plotData,
        logs
      });
    } catch (error) {
      console.error('Error fetching plot by ID for officer:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching plot'
      });
    }
  },
  
  // Update a plot's status and add a new log entry
  updatePlotStatus: async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      const userRole = req.session?.userRole;
      const plotId = req.params.id;
      const { status, description, notes } = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      if (!plotId || !status) {
        return res.status(400).json({
          success: false,
          message: 'Plot ID and status are required'
        });
      }
      
      // Validate status values
      const validStatuses = ['pending', 'in_progress', 'completed', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }
      
      // Get officer details to check their assigned circle
      const officerResult = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (officerResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Officer record not found'
        });
      }
      
      const officer = officerResult[0];
      
      // Get the plot
      const plotResult = await db.select()
        .from(plots)
        .where(eq(plots.id, plotId));
      
      if (plotResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Plot not found'
        });
      }
      
      const plot = plotResult[0];
      
      // Check if officer has access to this plot
      if (userRole === 'officer' && officer.circleId && plot.circleId !== officer.circleId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to plots outside your assigned circle'
        });
      }
      
      // Update plot status
      await db.update(plots)
        .set({
          status,
          updatedAt: new Date(),
          notes: notes || plot.notes
        })
        .where(eq(plots.id, plotId));
      
      // Add log entry
      const logEntry = {
        plotId,
        status,
        description: description || `Status updated to ${status}`,
        officerId: userId,
        createdAt: new Date()
      };
      
      await db.insert(demarcationLogs)
        .values(logEntry);
      
      return res.status(200).json({
        success: true,
        message: 'Plot status updated successfully'
      });
    } catch (error) {
      console.error('Error updating plot status by officer:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error updating plot status'
      });
    }
  },
  
  // Assign plot to an officer (ADC only)
  assignPlot: async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      const userRole = req.session?.userRole;
      const { plotId, officerId } = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      if (!plotId || !officerId) {
        return res.status(400).json({
          success: false,
          message: 'Plot ID and officer ID are required'
        });
      }
      
      // Only ADC can assign plots
      if (userRole !== 'adc') {
        return res.status(403).json({
          success: false,
          message: 'Only ADC can assign plots to officers'
        });
      }
      
      // Check if officer exists and is an officer
      const officerResult = await db.select()
        .from(users)
        .where(and(
          eq(users.id, officerId),
          eq(users.role, 'officer')
        ));
      
      if (officerResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Officer not found'
        });
      }
      
      const officer = officerResult[0];
      
      // Check if plot exists
      const plotResult = await db.select()
        .from(plots)
        .where(eq(plots.id, plotId));
      
      if (plotResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Plot not found'
        });
      }
      
      const plot = plotResult[0];
      
      // Update plot assignment
      await db.update(plots)
        .set({
          assignedOfficerId: officerId,
          status: 'in_progress',
          updatedAt: new Date()
        })
        .where(eq(plots.id, plotId));
      
      // Add log entry for assignment
      const logEntry = {
        plotId,
        status: 'in_progress',
        description: `Plot assigned to officer ${officer.name}`,
        officerId: userId, // ADC who did the assignment
        createdAt: new Date()
      };
      
      await db.insert(demarcationLogs)
        .values(logEntry);
      
      return res.status(200).json({
        success: true,
        message: 'Plot assigned successfully'
      });
    } catch (error) {
      console.error('Error assigning plot to officer:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error assigning plot'
      });
    }
  },
  
  // Get plots assigned to the current officer
  getMyAssignedPlots: async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      const status = req.query.status as string | undefined;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Build query based on filters
      let query = db.select({
        plot: plots,
        ownerName: users.name
      })
        .from(plots)
        .leftJoin(users, eq(plots.ownerId, users.id))
        .where(eq(plots.assignedOfficerId, userId))
        .orderBy(desc(plots.createdAt));
      
      // Apply status filter if provided
      if (status && status !== 'all') {
        query = query.where(eq(plots.status, status));
      }
      
      const results = await query;
      
      return res.status(200).json({
        success: true,
        plots: results
      });
    } catch (error) {
      console.error('Error fetching assigned plots for officer:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching assigned plots'
      });
    }
  },
  
  // Get plot statistics for officer dashboard
  getPlotStats: async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      const userRole = req.session?.userRole;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Get officer details to check their assigned circle
      const officerResult = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (officerResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Officer record not found'
        });
      }
      
      const officer = officerResult[0];
      
      // Different queries based on role
      let circleFilter = {};
      
      // Regular officers see only their circle
      if (userRole === 'officer' && officer.circleId) {
        circleFilter = { circleId: eq(plots.circleId, officer.circleId) };
      }
      
      // Count plots by status
      const pendingCount = await db
        .select({ count: sql`count(*)` })
        .from(plots)
        .where(and(
          eq(plots.status, 'pending'),
          ...Object.values(circleFilter)
        ));
      
      const inProgressCount = await db
        .select({ count: sql`count(*)` })
        .from(plots)
        .where(and(
          eq(plots.status, 'in_progress'),
          ...Object.values(circleFilter)
        ));
      
      const completedCount = await db
        .select({ count: sql`count(*)` })
        .from(plots)
        .where(and(
          eq(plots.status, 'completed'),
          ...Object.values(circleFilter)
        ));
      
      const rejectedCount = await db
        .select({ count: sql`count(*)` })
        .from(plots)
        .where(and(
          eq(plots.status, 'rejected'),
          ...Object.values(circleFilter)
        ));
      
      // Get assigned to me count
      const assignedToMeCount = await db
        .select({ count: sql`count(*)` })
        .from(plots)
        .where(eq(plots.assignedOfficerId, userId));
      
      // Total count
      const totalCount = await db
        .select({ count: sql`count(*)` })
        .from(plots)
        .where(and(...Object.values(circleFilter)));
      
      // Get recent activity
      const recentActivity = await db.select({
        log: demarcationLogs,
        plotKhasra: plots.khasraNumber,
        plotVillage: plots.villageName,
        officerName: users.name
      })
        .from(demarcationLogs)
        .leftJoin(plots, eq(demarcationLogs.plotId, plots.id))
        .leftJoin(users, eq(demarcationLogs.officerId, users.id))
        .where(and(
          ...Object.values(circleFilter)
        ))
        .orderBy(desc(demarcationLogs.createdAt))
        .limit(10);
      
      return res.status(200).json({
        success: true,
        stats: {
          pending: pendingCount[0]?.count || 0,
          in_progress: inProgressCount[0]?.count || 0,
          completed: completedCount[0]?.count || 0,
          rejected: rejectedCount[0]?.count || 0,
          assignedToMe: assignedToMeCount[0]?.count || 0,
          total: totalCount[0]?.count || 0
        },
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching plot stats for officer:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching plot statistics'
      });
    }
  }
};
