import axios from 'axios';
import { Plot } from '@/types/plots';

const API_BASE_URL = '/api/citizen/plots';

// Interface for citizen plot stats
export interface CitizenPlotStats {
  pending: number;
  in_progress: number;
  completed: number;
  rejected: number;
  total: number;
}

// Interface for plot creation request
export interface CreatePlotRequest {
  khasraNumber: string;
  village: string;
  size: string;
  requestType: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  villageName?: string;
  circleName?: string;
}

// Get all plots owned by the current citizen
export const fetchMyPlots = async (): Promise<Plot[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/my-plots`);
    if (response.data.success) {
      return response.data.plots;
    }
    throw new Error(response.data.message || 'Failed to fetch plots');
  } catch (error: any) {
    console.error('Error fetching citizen plots:', error);
    throw error;
  }
};

// Get a specific plot by ID (only if owned by the current citizen)
export const fetchPlotById = async (id: string): Promise<Plot> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    if (response.data.success) {
      return response.data.plot;
    }
    throw new Error(response.data.message || 'Failed to fetch plot details');
  } catch (error: any) {
    console.error('Error fetching citizen plot details:', error);
    throw error;
  }
};

// Get logs for a specific plot
export const fetchPlotLogs = async (plotId: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${plotId}/logs`);
    if (response.data.success) {
      return response.data.logs;
    }
    throw new Error(response.data.message || 'Failed to fetch plot logs');
  } catch (error: any) {
    console.error('Error fetching plot logs:', error);
    throw error;
  }
};

// Create a new demarcation request
export const createDemarcationRequest = async (plotData: CreatePlotRequest): Promise<Plot> => {
  try {
    const response = await axios.post(`${API_BASE_URL}`, plotData);
    if (response.data.success) {
      return response.data.plot;
    }
    throw new Error(response.data.message || 'Failed to create demarcation request');
  } catch (error: any) {
    console.error('Error creating demarcation request:', error);
    throw error;
  }
};

// Get plot statistics for citizen dashboard
export const fetchPlotStats = async (): Promise<CitizenPlotStats> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stats/dashboard`);
    if (response.data.success) {
      return response.data.stats;
    }
    throw new Error(response.data.message || 'Failed to fetch plot statistics');
  } catch (error: any) {
    console.error('Error fetching citizen plot statistics:', error);
    throw error;
  }
};
