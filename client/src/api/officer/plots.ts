import axios from 'axios';
import { Plot } from '@/types/plots';

const API_BASE_URL = '/api/officer/plots';

// Interface for officer plot stats
export interface OfficerPlotStats {
  pending: number;
  in_progress: number;
  completed: number;
  rejected: number;
  assignedToMe: number;
  total: number;
}

// Interface for recent activity
export interface RecentActivity {
  log: {
    id: string;
    plotId: string;
    status: string;
    description: string;
    officerId: string;
    createdAt: string;
    requestType?: string;
  };
  plotKhasra: string;
  plotVillage: string;
  officerName: string;
}

// Get all plots (filtered by circle for regular officers)
export const fetchAllPlots = async (status?: string, circleId?: string): Promise<Plot[]> => {
  try {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (circleId) params.circleId = circleId;
    
    const response = await axios.get(API_BASE_URL, { params });
    if (response.data.success) {
      return response.data.plots;
    }
    throw new Error(response.data.message || 'Failed to fetch plots');
  } catch (error: any) {
    console.error('Error fetching plots for officer:', error);
    throw error;
  }
};

// Get plots assigned to current officer
export const fetchMyAssignedPlots = async (status?: string): Promise<Plot[]> => {
  try {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    
    const response = await axios.get(`${API_BASE_URL}/my-assigned`, { params });
    if (response.data.success) {
      return response.data.plots;
    }
    throw new Error(response.data.message || 'Failed to fetch assigned plots');
  } catch (error: any) {
    console.error('Error fetching assigned plots for officer:', error);
    throw error;
  }
};

// Get a specific plot by ID with detailed info
export const fetchPlotById = async (id: string): Promise<{plot: Plot, logs: any[]}> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    if (response.data.success) {
      return {
        plot: response.data.plot,
        logs: response.data.logs
      };
    }
    throw new Error(response.data.message || 'Failed to fetch plot details');
  } catch (error: any) {
    console.error('Error fetching plot details for officer:', error);
    throw error;
  }
};

// Update a plot's status
export const updatePlotStatus = async (
  plotId: string, 
  status: string, 
  description?: string,
  notes?: string
): Promise<void> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${plotId}/status`, {
      status,
      description,
      notes
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update plot status');
    }
  } catch (error: any) {
    console.error('Error updating plot status:', error);
    throw error;
  }
};

// Assign plot to an officer (ADC only)
export const assignPlot = async (plotId: string, officerId: string): Promise<void> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/assign`, {
      plotId,
      officerId
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to assign plot');
    }
  } catch (error: any) {
    console.error('Error assigning plot to officer:', error);
    throw error;
  }
};

// Get plot statistics for officer dashboard
export const fetchPlotStats = async (): Promise<{stats: OfficerPlotStats, recentActivity: RecentActivity[]}> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stats/dashboard`);
    if (response.data.success) {
      return {
        stats: response.data.stats,
        recentActivity: response.data.recentActivity
      };
    }
    throw new Error(response.data.message || 'Failed to fetch plot statistics');
  } catch (error: any) {
    console.error('Error fetching plot statistics for officer:', error);
    throw error;
  }
};
