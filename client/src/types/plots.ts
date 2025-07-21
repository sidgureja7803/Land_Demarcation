export interface Plot {
  id: number;
  plotId: string;
  ownerName: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'in_progress' | 'completed' | 'disputed' | 'on_hold';
  villageName: string;
  circleName?: string;
  area?: number;
  areaUnit?: string;
  plotType?: string;
  ownerContact?: string;
  lastUpdated?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}
