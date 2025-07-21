import {
  users,
  circles,
  districts,
  villages,
  plots,
  demarcationLogs,
  plotAssignments,
  type User,
  type UpsertUser,
  type Circle,
  type District,
  type Village,
  type Plot,
  type DemarcationLog,
  type PlotAssignment,
  type InsertCircle,
  type InsertDistrict,
  type InsertVillage,
  type InsertPlot,
  type InsertDemarcationLog,
  type InsertPlotAssignment,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, ilike, sql, count } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Circle operations
  getCircles(): Promise<Circle[]>;
  getCircle(id: number): Promise<Circle | undefined>;
  createCircle(circle: InsertCircle): Promise<Circle>;
  
  // District operations
  getDistricts(): Promise<District[]>;
  getDistrict(id: number): Promise<District | undefined>;
  createDistrict(district: InsertDistrict): Promise<District>;
  
  // Village operations
  getVillages(circleId?: number): Promise<Village[]>;
  getVillage(id: number): Promise<Village | undefined>;
  createVillage(village: InsertVillage): Promise<Village>;
  
  // Plot operations
  getPlots(filters?: {
    assignedOfficerId?: string;
    status?: string;
    plotType?: string;
    priority?: string;
    villageId?: number;
    circleId?: number;
    search?: string;
    isDuplicate?: boolean;
  }): Promise<Plot[]>;
  getPlot(id: number): Promise<Plot | undefined>;
  createPlot(plot: InsertPlot): Promise<Plot>;
  updatePlot(id: number, updates: Partial<InsertPlot>): Promise<Plot>;
  
  // Demarcation log operations
  getDemarcationLogs(filters?: {
    plotId?: number;
    officerId?: string;
    activityType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<DemarcationLog[]>;
  getDemarcationLog(id: number): Promise<DemarcationLog | undefined>;
  createDemarcationLog(log: InsertDemarcationLog): Promise<DemarcationLog>;
  updateDemarcationLog(id: number, updates: Partial<InsertDemarcationLog>): Promise<DemarcationLog>;
  
  // Plot assignment operations
  getPlotAssignments(filters?: {
    plotId?: number;
    officerId?: string;
    isActive?: boolean;
  }): Promise<PlotAssignment[]>;
  createPlotAssignment(assignment: InsertPlotAssignment): Promise<PlotAssignment>;
  updatePlotAssignment(id: number, updates: Partial<InsertPlotAssignment>): Promise<PlotAssignment>;
  
  // Dashboard statistics
  getDashboardStats(officerId?: string, circleId?: number): Promise<{
    assignedPlots: number;
    pendingCases: number;
    completedToday: number;
    resolutionRate: number;
  }>;
  
  // Duplicate detection
  detectDuplicatePlots(plotId: string, villageId: number): Promise<Plot[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Circle operations
  async getCircles(): Promise<Circle[]> {
    return await db.select().from(circles).orderBy(asc(circles.name));
  }

  async getCircle(id: number): Promise<Circle | undefined> {
    const [circle] = await db.select().from(circles).where(eq(circles.id, id));
    return circle;
  }

  async createCircle(circle: InsertCircle): Promise<Circle> {
    const [newCircle] = await db.insert(circles).values(circle).returning();
    return newCircle;
  }

  // District operations
  async getDistricts(): Promise<District[]> {
    return await db.select().from(districts).orderBy(asc(districts.name));
  }

  async getDistrict(id: number): Promise<District | undefined> {
    const [district] = await db.select().from(districts).where(eq(districts.id, id));
    return district;
  }

  async createDistrict(district: InsertDistrict): Promise<District> {
    const [newDistrict] = await db.insert(districts).values(district).returning();
    return newDistrict;
  }

  // Village operations
  async getVillages(circleId?: number): Promise<Village[]> {
    const query = db.select().from(villages);
    if (circleId) {
      return await query.where(eq(villages.circleId, circleId)).orderBy(asc(villages.name));
    }
    return await query.orderBy(asc(villages.name));
  }

  async getVillage(id: number): Promise<Village | undefined> {
    const [village] = await db.select().from(villages).where(eq(villages.id, id));
    return village;
  }

  async createVillage(village: InsertVillage): Promise<Village> {
    const [newVillage] = await db.insert(villages).values(village).returning();
    return newVillage;
  }

  // Plot operations
  async getPlots(filters?: {
    assignedOfficerId?: string;
    status?: string;
    plotType?: string;
    priority?: string;
    villageId?: number;
    circleId?: number;
    search?: string;
    isDuplicate?: boolean;
  }): Promise<Plot[]> {
    let query = db.select().from(plots);
    
    if (filters) {
      const conditions = [];
      
      if (filters.assignedOfficerId) {
        conditions.push(eq(plots.assignedOfficerId, filters.assignedOfficerId));
      }
      
      if (filters.status) {
        conditions.push(eq(plots.currentStatus, filters.status));
      }
      
      if (filters.plotType) {
        conditions.push(eq(plots.plotType, filters.plotType));
      }
      
      if (filters.priority) {
        conditions.push(eq(plots.priority, filters.priority));
      }
      
      if (filters.villageId) {
        conditions.push(eq(plots.villageId, filters.villageId));
      }
      
      if (filters.search) {
        conditions.push(ilike(plots.plotId, `%${filters.search}%`));
      }
      
      if (filters.isDuplicate !== undefined) {
        conditions.push(eq(plots.isDuplicate, filters.isDuplicate));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(plots.updatedAt));
  }

  async getPlot(id: number): Promise<Plot | undefined> {
    const [plot] = await db.select().from(plots).where(eq(plots.id, id));
    return plot;
  }

  async createPlot(plot: InsertPlot): Promise<Plot> {
    const [newPlot] = await db.insert(plots).values(plot).returning();
    return newPlot;
  }

  async updatePlot(id: number, updates: Partial<InsertPlot>): Promise<Plot> {
    const [updatedPlot] = await db
      .update(plots)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(plots.id, id))
      .returning();
    return updatedPlot;
  }

  // Demarcation log operations
  async getDemarcationLogs(filters?: {
    plotId?: number;
    officerId?: string;
    activityType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<DemarcationLog[]> {
    let query = db.select().from(demarcationLogs).where(eq(demarcationLogs.isDeleted, false));
    
    if (filters) {
      const conditions = [eq(demarcationLogs.isDeleted, false)];
      
      if (filters.plotId) {
        conditions.push(eq(demarcationLogs.plotId, filters.plotId));
      }
      
      if (filters.officerId) {
        conditions.push(eq(demarcationLogs.officerId, filters.officerId));
      }
      
      if (filters.activityType) {
        conditions.push(eq(demarcationLogs.activityType, filters.activityType));
      }
      
      if (filters.status) {
        conditions.push(eq(demarcationLogs.currentStatus, filters.status));
      }
      
      if (filters.startDate) {
        conditions.push(sql`${demarcationLogs.activityDate} >= ${filters.startDate}`);
      }
      
      if (filters.endDate) {
        conditions.push(sql`${demarcationLogs.activityDate} <= ${filters.endDate}`);
      }
      
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(demarcationLogs.activityDate));
  }

  async getDemarcationLog(id: number): Promise<DemarcationLog | undefined> {
    const [log] = await db
      .select()
      .from(demarcationLogs)
      .where(and(eq(demarcationLogs.id, id), eq(demarcationLogs.isDeleted, false)));
    return log;
  }

  async createDemarcationLog(log: InsertDemarcationLog): Promise<DemarcationLog> {
    const [newLog] = await db.insert(demarcationLogs).values(log).returning();
    return newLog;
  }

  async updateDemarcationLog(id: number, updates: Partial<InsertDemarcationLog>): Promise<DemarcationLog> {
    const [updatedLog] = await db
      .update(demarcationLogs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(demarcationLogs.id, id))
      .returning();
    return updatedLog;
  }

  // Plot assignment operations
  async getPlotAssignments(filters?: {
    plotId?: number;
    officerId?: string;
    isActive?: boolean;
  }): Promise<PlotAssignment[]> {
    let query = db.select().from(plotAssignments);
    
    if (filters) {
      const conditions = [];
      
      if (filters.plotId) {
        conditions.push(eq(plotAssignments.plotId, filters.plotId));
      }
      
      if (filters.officerId) {
        conditions.push(eq(plotAssignments.officerId, filters.officerId));
      }
      
      if (filters.isActive !== undefined) {
        conditions.push(eq(plotAssignments.isActive, filters.isActive));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(plotAssignments.assignedAt));
  }

  async createPlotAssignment(assignment: InsertPlotAssignment): Promise<PlotAssignment> {
    const [newAssignment] = await db.insert(plotAssignments).values(assignment).returning();
    return newAssignment;
  }

  async updatePlotAssignment(id: number, updates: Partial<InsertPlotAssignment>): Promise<PlotAssignment> {
    const [updatedAssignment] = await db
      .update(plotAssignments)
      .set(updates)
      .where(eq(plotAssignments.id, id))
      .returning();
    return updatedAssignment;
  }

  // Dashboard statistics
  async getDashboardStats(officerId?: string, circleId?: number): Promise<{
    assignedPlots: number;
    pendingCases: number;
    completedToday: number;
    resolutionRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let plotsQuery = db.select({ count: count() }).from(plots);
    let pendingQuery = db.select({ count: count() }).from(plots);
    let completedTodayQuery = db.select({ count: count() }).from(demarcationLogs);
    let totalLogsQuery = db.select({ count: count() }).from(demarcationLogs);
    let completedLogsQuery = db.select({ count: count() }).from(demarcationLogs);
    
    if (officerId) {
      plotsQuery = plotsQuery.where(eq(plots.assignedOfficerId, officerId));
      pendingQuery = pendingQuery.where(
        and(
          eq(plots.assignedOfficerId, officerId),
          eq(plots.currentStatus, 'pending')
        )
      );
      completedTodayQuery = completedTodayQuery.where(
        and(
          eq(demarcationLogs.officerId, officerId),
          eq(demarcationLogs.currentStatus, 'completed'),
          sql`${demarcationLogs.activityDate} >= ${today}`,
          sql`${demarcationLogs.activityDate} < ${tomorrow}`
        )
      );
      totalLogsQuery = totalLogsQuery.where(eq(demarcationLogs.officerId, officerId));
      completedLogsQuery = completedLogsQuery.where(
        and(
          eq(demarcationLogs.officerId, officerId),
          eq(demarcationLogs.currentStatus, 'completed')
        )
      );
    } else {
      pendingQuery = pendingQuery.where(eq(plots.currentStatus, 'pending'));
      completedTodayQuery = completedTodayQuery.where(
        and(
          eq(demarcationLogs.currentStatus, 'completed'),
          sql`${demarcationLogs.activityDate} >= ${today}`,
          sql`${demarcationLogs.activityDate} < ${tomorrow}`
        )
      );
      completedLogsQuery = completedLogsQuery.where(eq(demarcationLogs.currentStatus, 'completed'));
    }
    
    const [
      assignedPlotsResult,
      pendingCasesResult,
      completedTodayResult,
      totalLogsResult,
      completedLogsResult,
    ] = await Promise.all([
      plotsQuery,
      pendingQuery,
      completedTodayQuery,
      totalLogsQuery,
      completedLogsQuery,
    ]);
    
    const assignedPlots = assignedPlotsResult[0]?.count || 0;
    const pendingCases = pendingCasesResult[0]?.count || 0;
    const completedToday = completedTodayResult[0]?.count || 0;
    const totalLogs = totalLogsResult[0]?.count || 0;
    const completedLogs = completedLogsResult[0]?.count || 0;
    
    const resolutionRate = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;
    
    return {
      assignedPlots,
      pendingCases,
      completedToday,
      resolutionRate,
    };
  }

  // Duplicate detection
  async detectDuplicatePlots(plotId: string, villageId: number): Promise<Plot[]> {
    return await db
      .select()
      .from(plots)
      .where(
        and(
          eq(plots.plotId, plotId),
          eq(plots.villageId, villageId)
        )
      );
  }
}

export const storage = new DatabaseStorage();
