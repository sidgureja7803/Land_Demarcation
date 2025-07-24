import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllPlots } from '@/api/shared/plots';
import PlotMap from '@/components/plot-map';
import { Plot } from '@/types/plots';
import { Loader2 } from 'lucide-react';

interface PlotsMapDisplayProps {
  userType?: 'citizen' | 'officer' | 'admin';
  height?: string;
  showAllPlots?: boolean;
  maxPlots?: number;
  onSelectPlot?: (plot: Plot) => void;
}

export default function PlotsMapDisplay({
  userType = 'citizen',
  height = '400px',
  showAllPlots = true,
  maxPlots = 50,
  onSelectPlot
}: PlotsMapDisplayProps) {
  // Query plot data from API
  const { data: plots, isLoading, error } = useQuery<Plot[]>({
    queryKey: ['plots'],
    queryFn: fetchAllPlots,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle different states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ height }}>
        <p className="text-destructive font-medium">Failed to load plot data</p>
        <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
      </div>
    );
  }

  // If no plots found
  if (!plots || plots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ height }}>
        <p className="text-muted-foreground">No plots available</p>
      </div>
    );
  }

  // Filter plots if needed
  const displayPlots = showAllPlots 
    ? plots.slice(0, maxPlots) 
    : plots.slice(0, Math.min(5, plots.length));

  return (
    <PlotMap 
      plots={displayPlots}
      height={height}
      showAllPlots={showAllPlots}
      onSelectPlot={onSelectPlot}
    />
  );
}
