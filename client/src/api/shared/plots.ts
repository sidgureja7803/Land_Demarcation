import { Plot } from '@/types/plots';
import { fetchWithToken } from '@/lib/auth';

export async function fetchAllPlots(): Promise<Plot[]> {
  try {
    const response = await fetchWithToken('/api/plots');
    if (!response.ok) {
      throw new Error('Failed to fetch plots');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching plots:', error);
    throw error;
  }
}

export async function fetchPlotById(id: number): Promise<Plot> {
  try {
    const response = await fetchWithToken(`/api/plots/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch plot');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching plot with id ${id}:`, error);
    throw error;
  }
}
