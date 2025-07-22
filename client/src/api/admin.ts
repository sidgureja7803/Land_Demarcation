import { handleApiError } from '@/lib/authUtils';

// Admin dashboard statistics
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

// Status breakdown for charts
export interface StatusBreakdown {
  name: string;
  count: number;
}

// Officer performance data
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

// Fetch admin dashboard statistics
export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const response = await fetch('/api/admin/stats', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    throw error;
  }
}

// Fetch plot status distribution for charts
export async function fetchStatusDistribution(): Promise<StatusBreakdown[]> {
  try {
    const response = await fetch('/api/admin/status-distribution', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch status distribution:', error);
    throw error;
  }
}

// Fetch circle-wise plot distribution for charts
export async function fetchCircleDistribution(): Promise<StatusBreakdown[]> {
  try {
    const response = await fetch('/api/admin/circle-distribution', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch circle distribution:', error);
    throw error;
  }
}

// Fetch village-wise plot distribution for charts
export async function fetchVillageDistribution(): Promise<StatusBreakdown[]> {
  try {
    const response = await fetch('/api/admin/village-distribution', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch village distribution:', error);
    throw error;
  }
}

// Fetch officer performance data
export async function fetchOfficerPerformance(): Promise<OfficerPerformance[]> {
  try {
    const response = await fetch('/api/admin/officer-performance', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch officer performance:', error);
    throw error;
  }
}

// Generate and download report
export async function generateReport(
  reportType: string, 
  format: string, 
  dateRange?: { from: Date; to: Date }
): Promise<Blob> {
  try {
    const params = new URLSearchParams({
      type: reportType,
      format: format,
    });
    
    if (dateRange) {
      params.append('fromDate', dateRange.from.toISOString());
      params.append('toDate', dateRange.to.toISOString());
    }
    
    const response = await fetch(`/api/admin/reports?${params.toString()}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Failed to generate report:', error);
    throw error;
  }
}
