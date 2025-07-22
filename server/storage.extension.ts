import { IStorage } from "./storage";
import { 
  plots, 
  users, 
  demarcationLogs, 
  plotAssignments, 
  villages, 
  circles 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql, gt, lt, between } from "drizzle-orm";

// Types for admin dashboard
export interface AdminStats {
  totalPlots: number;
  completedPlots: number;
  pendingPlots: number;
  activeOfficers: number;
  totalVillages: number;
  duplicates: number;
  averageResolutionTime: string;
  completionRate: string;
}

export interface StatusBreakdown {
  name: string;
  count: number;
}

export interface OfficerPerformance {
  id: string;
  name: string;
  circle: string;
  completedPlots: number;
  pendingPlots: number;
  efficiency: number;
  avgTimePerPlot: string;
  lastActivity: string;
}

// Extension for the IStorage interface
export interface AdminStorage {
  // Admin dashboard statistics
  getAdminStats(): Promise<AdminStats>;
  
  // Chart data
  getStatusDistribution(): Promise<StatusBreakdown[]>;
  getCircleDistribution(): Promise<StatusBreakdown[]>;
  getVillageDistribution(): Promise<StatusBreakdown[]>;
  
  // Officer performance
  getOfficerPerformance(): Promise<OfficerPerformance[]>;
  
  // Report generation
  generateReport(reportType: string, fromDate?: Date | null, toDate?: Date | null): Promise<any[]>;
}

// Implementation of admin dashboard functionality
export class AdminDatabaseStorage implements AdminStorage {
  async getAdminStats(): Promise<AdminStats> {
    // Get total plots count
    const [totalPlotsResult] = await db
      .select({ count: count() })
      .from(plots);
    const totalPlots = totalPlotsResult?.count || 0;
    
    // Get completed plots count
    const [completedPlotsResult] = await db
      .select({ count: count() })
      .from(plots)
      .where(eq(plots.status, 'completed'));
    const completedPlots = completedPlotsResult?.count || 0;
    
    // Get pending plots count
    const [pendingPlotsResult] = await db
      .select({ count: count() })
      .from(plots)
      .where(eq(plots.status, 'pending'));
    const pendingPlots = pendingPlotsResult?.count || 0;
    
    // Get active officers count
    const [activeOfficersResult] = await db
      .select({ count: count(sql`DISTINCT ${plotAssignments.userId}`) })
      .from(plotAssignments)
      .where(eq(plotAssignments.status, 'active'));
    const activeOfficers = activeOfficersResult?.count || 0;
    
    // Get total villages count
    const [totalVillagesResult] = await db
      .select({ count: count() })
      .from(villages);
    const totalVillages = totalVillagesResult?.count || 0;
    
    // Get duplicate plots count (plots with same khasra number in same village)
    const [duplicatesResult] = await db
      .select({ count: count() })
      .from(plots)
      .innerJoin(
        plots as any, 
        and(
          eq(plots.khasraNumber, sql`plots_2.khasra_number`),
          eq(plots.villageId, sql`plots_2.village_id`),
          gt(plots.id, sql`plots_2.id`)
        )
      );
    const duplicates = duplicatesResult?.count || 0;
    
    // Get average resolution time in days
    const [avgTimeResult] = await db
      .select({
        avgDays: sql`AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400)::float`
      })
      .from(demarcationLogs)
      .where(eq(demarcationLogs.status, 'completed'));
    const avgDays = avgTimeResult?.avgDays || 0;
    const averageResolutionTime = `${Math.round(avgDays)} days`;
    
    // Calculate completion rate
    const completionRate = totalPlots > 0 
      ? `${Math.round((completedPlots / totalPlots) * 100)}%` 
      : '0%';
    
    return {
      totalPlots,
      completedPlots,
      pendingPlots,
      activeOfficers,
      totalVillages,
      duplicates,
      averageResolutionTime,
      completionRate
    };
  }
  
  async getStatusDistribution(): Promise<StatusBreakdown[]> {
    const results = await db
      .select({
        name: plots.status,
        count: count()
      })
      .from(plots)
      .groupBy(plots.status)
      .orderBy(desc(count()));
    
    return results.map(item => ({
      name: item.name || 'unknown',
      count: item.count
    }));
  }
  
  async getCircleDistribution(): Promise<StatusBreakdown[]> {
    const results = await db
      .select({
        name: circles.name,
        count: count()
      })
      .from(plots)
      .leftJoin(villages, eq(plots.villageId, villages.id))
      .leftJoin(circles, eq(villages.circleId, circles.id))
      .groupBy(circles.name)
      .orderBy(desc(count()));
    
    return results.map(item => ({
      name: item.name || 'unknown',
      count: item.count
    }));
  }
  
  async getVillageDistribution(): Promise<StatusBreakdown[]> {
    const results = await db
      .select({
        name: villages.name,
        count: count()
      })
      .from(plots)
      .leftJoin(villages, eq(plots.villageId, villages.id))
      .groupBy(villages.name)
      .orderBy(desc(count()));
    
    return results.map(item => ({
      name: item.name || 'unknown',
      count: item.count
    }));
  }
  
  async getOfficerPerformance(): Promise<OfficerPerformance[]> {
    const officers = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(eq(users.role, 'officer'));
    
    const performance: OfficerPerformance[] = [];
    
    for (const officer of officers) {
      // Get circle name
      const [circleResult] = await db
        .select({
          circleName: circles.name
        })
        .from(plotAssignments)
        .innerJoin(plots, eq(plotAssignments.plotId, plots.id))
        .innerJoin(villages, eq(plots.villageId, villages.id))
        .innerJoin(circles, eq(villages.circleId, circles.id))
        .where(eq(plotAssignments.userId, officer.id))
        .limit(1);
      
      // Get completed plots
      const [completedResult] = await db
        .select({ count: count() })
        .from(demarcationLogs)
        .where(
          and(
            eq(demarcationLogs.officerId, officer.id),
            eq(demarcationLogs.status, 'completed')
          )
        );
      
      // Get pending plots
      const [pendingResult] = await db
        .select({ count: count() })
        .from(plotAssignments)
        .where(
          and(
            eq(plotAssignments.userId, officer.id),
            eq(plotAssignments.status, 'active')
          )
        );
      
      // Get average time per plot
      const [avgTimeResult] = await db
        .select({
          avgDays: sql`AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400)::float`
        })
        .from(demarcationLogs)
        .where(
          and(
            eq(demarcationLogs.officerId, officer.id),
            eq(demarcationLogs.status, 'completed')
          )
        );
      
      // Get last activity
      const [lastActivityResult] = await db
        .select({
          lastActivity: demarcationLogs.updatedAt
        })
        .from(demarcationLogs)
        .where(eq(demarcationLogs.officerId, officer.id))
        .orderBy(desc(demarcationLogs.updatedAt))
        .limit(1);
      
      const completedPlots = completedResult?.count || 0;
      const pendingPlots = pendingResult?.count || 0;
      const efficiency = completedPlots + pendingPlots > 0
        ? Math.round((completedPlots / (completedPlots + pendingPlots)) * 100)
        : 0;
      
      const avgDays = avgTimeResult?.avgDays || 0;
      const avgTimePerPlot = avgDays > 0 ? `${Math.round(avgDays)} days` : 'N/A';
      
      const lastActivity = lastActivityResult?.lastActivity 
        ? new Date(lastActivityResult.lastActivity).toLocaleDateString()
        : 'Never';
      
      performance.push({
        id: officer.id,
        name: officer.name || 'Unknown',
        circle: circleResult?.circleName || 'Unassigned',
        completedPlots,
        pendingPlots,
        efficiency,
        avgTimePerPlot,
        lastActivity
      });
    }
    
    return performance.sort((a, b) => b.efficiency - a.efficiency);
  }
  
  async generateReport(reportType: string, fromDate?: Date | null, toDate?: Date | null): Promise<any[]> {
    let dateFilter = {};
    
    if (fromDate && toDate) {
      dateFilter = between(plots.createdAt, fromDate, toDate);
    } else if (fromDate) {
      dateFilter = gt(plots.createdAt, fromDate);
    } else if (toDate) {
      dateFilter = lt(plots.createdAt, toDate);
    }
    
    switch (reportType) {
      case 'plotStatus': {
        const results = await db
          .select({
            khasraNumber: plots.khasraNumber,
            villageName: villages.name,
            circleName: circles.name,
            ownerName: plots.ownerName,
            area: plots.area,
            status: plots.status,
            priority: plots.priority,
            createdAt: plots.createdAt
          })
          .from(plots)
          .leftJoin(villages, eq(plots.villageId, villages.id))
          .leftJoin(circles, eq(villages.circleId, circles.id))
          .where(fromDate || toDate ? dateFilter : sql`1=1`)
          .orderBy(desc(plots.createdAt));
        
        return results.map(row => ({
          ...row,
          createdAt: row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Unknown'
        }));
      }
      
      case 'villageStats': {
        const results = await db
          .select({
            villageName: villages.name,
            totalPlots: count(),
            completedPlots: sql`COUNT(CASE WHEN ${plots.status} = 'completed' THEN 1 END)`,
            pendingPlots: sql`COUNT(CASE WHEN ${plots.status} = 'pending' THEN 1 END)`,
            avgResolutionDays: sql`ROUND(AVG(EXTRACT(EPOCH FROM (${demarcationLogs.completedAt} - ${demarcationLogs.createdAt})) / 86400)::float)`
          })
          .from(plots)
          .leftJoin(villages, eq(plots.villageId, villages.id))
          .leftJoin(demarcationLogs, eq(plots.id, demarcationLogs.plotId))
          .where(fromDate || toDate ? dateFilter : sql`1=1`)
          .groupBy(villages.name)
          .orderBy(desc(count()));
        
        return results;
      }
      
      default:
        return [];
    }
  }
}

// Initialize the admin storage class
export const adminStorage = new AdminDatabaseStorage();
