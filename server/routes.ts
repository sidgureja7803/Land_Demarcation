import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { isAuthenticated } from "./middleware/shared/authMiddleware";
import { 
  insertPlotSchema, 
  insertDemarcationLogSchema, 
  insertPlotAssignmentSchema,
  insertCircleSchema,
  insertDistrictSchema,
  insertVillageSchema
} from "../shared/schema";
import plotsRouter from "./routes/shared/plotRoutes";
import documentRoutes from "./routes/documentRoutes";

// Import role-based routes
import citizenRoutes from "./routes/citizen/citizenRoutes";
import officerRoutes from "./routes/officer/officerRoutes";
import citizenPlotRoutes from "./routes/citizen/plotRoutes";
import officerPlotRoutes from "./routes/officer/plotRoutes";
import adminRouter from "./routes/admin/adminRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Register plot routes
  app.use('/api', plotsRouter);
  
  // Register document routes
  app.use('/api/documents', documentRoutes);
  
  // Register admin routes
  app.use('/api/admin', adminRouter);
  
  // Register role-based routes
  app.use('/api/citizen', citizenRoutes);
  app.use('/api/officer', officerRoutes);
  app.use('/api/citizen/plots', citizenPlotRoutes);
  app.use('/api/officer/plots', officerPlotRoutes);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const stats = await storage.getDashboardStats(
        user?.role === 'officer' ? userId : undefined,
        user?.circleId || undefined
      );
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Circle routes
  app.get('/api/circles', isAuthenticated, async (req, res) => {
    try {
      const circles = await storage.getCircles();
      res.json(circles);
    } catch (error) {
      console.error("Error fetching circles:", error);
      res.status(500).json({ message: "Failed to fetch circles" });
    }
  });

  app.post('/api/circles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'administrator') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const validatedData = insertCircleSchema.parse(req.body);
      const circle = await storage.createCircle(validatedData);
      res.status(201).json(circle);
    } catch (error) {
      console.error("Error creating circle:", error);
      res.status(500).json({ message: "Failed to create circle" });
    }
  });

  // District routes
  app.get('/api/districts', isAuthenticated, async (req, res) => {
    try {
      const districts = await storage.getDistricts();
      res.json(districts);
    } catch (error) {
      console.error("Error fetching districts:", error);
      res.status(500).json({ message: "Failed to fetch districts" });
    }
  });

  app.post('/api/districts', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'administrator') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const validatedData = insertDistrictSchema.parse(req.body);
      const district = await storage.createDistrict(validatedData);
      res.status(201).json(district);
    } catch (error) {
      console.error("Error creating district:", error);
      res.status(500).json({ message: "Failed to create district" });
    }
  });

  // Village routes
  app.get('/api/villages', isAuthenticated, async (req, res) => {
    try {
      const circleId = req.query.circleId ? parseInt(req.query.circleId as string) : undefined;
      const villages = await storage.getVillages(circleId);
      res.json(villages);
    } catch (error) {
      console.error("Error fetching villages:", error);
      res.status(500).json({ message: "Failed to fetch villages" });
    }
  });

  app.post('/api/villages', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role === 'officer') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const validatedData = insertVillageSchema.parse(req.body);
      const village = await storage.createVillage(validatedData);
      res.status(201).json(village);
    } catch (error) {
      console.error("Error creating village:", error);
      res.status(500).json({ message: "Failed to create village" });
    }
  });

  // Plot routes
  app.get('/api/plots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const filters: any = {};
      
      // Officers can only see their assigned plots
      if (user?.role === 'officer') {
        filters.assignedOfficerId = userId;
      }
      
      // Apply query filters
      if (req.query.status) filters.status = req.query.status;
      if (req.query.plotType) filters.plotType = req.query.plotType;
      if (req.query.priority) filters.priority = req.query.priority;
      if (req.query.villageId) filters.villageId = parseInt(req.query.villageId as string);
      if (req.query.search) filters.search = req.query.search;
      if (req.query.isDuplicate !== undefined) filters.isDuplicate = req.query.isDuplicate === 'true';
      
      const plots = await storage.getPlots(filters);
      res.json(plots);
    } catch (error) {
      console.error("Error fetching plots:", error);
      res.status(500).json({ message: "Failed to fetch plots" });
    }
  });

  app.get('/api/plots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const plotId = parseInt(req.params.id);
      const plot = await storage.getPlot(plotId);
      
      if (!plot) {
        return res.status(404).json({ message: "Plot not found" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Officers can only view their assigned plots
      if (user?.role === 'officer' && plot.assignedOfficerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(plot);
    } catch (error) {
      console.error("Error fetching plot:", error);
      res.status(500).json({ message: "Failed to fetch plot" });
    }
  });

  app.post('/api/plots', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role === 'officer') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const validatedData = insertPlotSchema.parse(req.body);
      
      // Check for duplicates
      const duplicates = await storage.detectDuplicatePlots(validatedData.plotId, validatedData.villageId!);
      if (duplicates.length > 0) {
        validatedData.isDuplicate = true;
        validatedData.duplicateOfId = duplicates[0].id;
      }
      
      const plot = await storage.createPlot(validatedData);
      res.status(201).json(plot);
    } catch (error) {
      console.error("Error creating plot:", error);
      res.status(500).json({ message: "Failed to create plot" });
    }
  });

  app.put('/api/plots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const plotId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const plot = await storage.getPlot(plotId);
      if (!plot) {
        return res.status(404).json({ message: "Plot not found" });
      }
      
      // Officers can only update their assigned plots
      if (user?.role === 'officer' && plot.assignedOfficerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertPlotSchema.partial().parse(req.body);
      const updatedPlot = await storage.updatePlot(plotId, validatedData);
      res.json(updatedPlot);
    } catch (error) {
      console.error("Error updating plot:", error);
      res.status(500).json({ message: "Failed to update plot" });
    }
  });

  // Demarcation log routes
  app.get('/api/demarcation-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const filters: any = {};
      
      // Officers can only see their logs
      if (user?.role === 'officer') {
        filters.officerId = userId;
      }
      
      // Apply query filters
      if (req.query.plotId) filters.plotId = parseInt(req.query.plotId as string);
      if (req.query.activityType) filters.activityType = req.query.activityType;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      
      const logs = await storage.getDemarcationLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching demarcation logs:", error);
      res.status(500).json({ message: "Failed to fetch demarcation logs" });
    }
  });

  app.get('/api/demarcation-logs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const logId = parseInt(req.params.id);
      const log = await storage.getDemarcationLog(logId);
      
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Officers can only view their logs
      if (user?.role === 'officer' && log.officerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(log);
    } catch (error) {
      console.error("Error fetching demarcation log:", error);
      res.status(500).json({ message: "Failed to fetch demarcation log" });
    }
  });

  app.post('/api/demarcation-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertDemarcationLogSchema.parse({
        ...req.body,
        officerId: userId
      });
      
      // Verify the officer can access this plot
      const plot = await storage.getPlot(validatedData.plotId);
      if (!plot) {
        return res.status(404).json({ message: "Plot not found" });
      }
      
      const user = await storage.getUser(userId);
      if (user?.role === 'officer' && plot.assignedOfficerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const log = await storage.createDemarcationLog(validatedData);
      
      // Update plot status if needed
      if (validatedData.currentStatus === 'completed') {
        await storage.updatePlot(validatedData.plotId, { currentStatus: 'completed' });
      }
      
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating demarcation log:", error);
      res.status(500).json({ message: "Failed to create demarcation log" });
    }
  });

  app.put('/api/demarcation-logs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const logId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const log = await storage.getDemarcationLog(logId);
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      
      const user = await storage.getUser(userId);
      if (user?.role === 'officer' && log.officerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertDemarcationLogSchema.partial().parse(req.body);
      const updatedLog = await storage.updateDemarcationLog(logId, validatedData);
      res.json(updatedLog);
    } catch (error) {
      console.error("Error updating demarcation log:", error);
      res.status(500).json({ message: "Failed to update demarcation log" });
    }
  });

  // Plot assignment routes
  app.get('/api/plot-assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const filters: any = {};
      
      if (user?.role === 'officer') {
        filters.officerId = userId;
      }
      
      if (req.query.plotId) filters.plotId = parseInt(req.query.plotId as string);
      if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
      
      const assignments = await storage.getPlotAssignments(filters);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching plot assignments:", error);
      res.status(500).json({ message: "Failed to fetch plot assignments" });
    }
  });

  app.post('/api/plot-assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'officer') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertPlotAssignmentSchema.parse({
        ...req.body,
        assignedBy: userId
      });
      
      const assignment = await storage.createPlotAssignment(validatedData);
      
      // Update plot assignment
      await storage.updatePlot(validatedData.plotId, { 
        assignedOfficerId: validatedData.officerId 
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating plot assignment:", error);
      res.status(500).json({ message: "Failed to create plot assignment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
