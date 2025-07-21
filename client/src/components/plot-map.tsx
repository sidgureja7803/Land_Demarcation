import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fixing the default icon issue in React-Leaflet
// This is needed because the default markers in Leaflet look for assets in a specific path
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';

// Define types for plot data
export interface PlotLocation {
  id: number;
  plotId: string;
  ownerName: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'in_progress' | 'completed' | 'disputed' | 'on_hold';
  villageName?: string;
  circleName?: string;
  area?: number;
  lastUpdated?: string;
}

interface PlotMapProps {
  plots?: PlotLocation[];
  height?: string;
  width?: string;
  center?: LatLngTuple;
  zoom?: number;
  onPlotClick?: (plot: PlotLocation) => void;
  showAllPlots?: boolean;
}

// Fix Leaflet default icon issue
const defaultIcon = new Icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconRetinaUrl: markerIcon2xUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icons based on plot status
const getStatusIcon = (status: PlotLocation['status']) => {
  // Colors for different statuses
  const iconColors = {
    pending: '#FFA500', // Orange
    in_progress: '#3B82F6', // Blue
    completed: '#10B981', // Green
    disputed: '#EF4444', // Red
    on_hold: '#6B7280', // Gray
  };
  
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="${iconColors[status]}" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  `;
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

// Component to adjust map view to show all markers
function SetMapBounds({ plots }: { plots?: PlotLocation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (plots && plots.length > 0) {
      const bounds = plots.map(plot => [plot.latitude, plot.longitude] as LatLngTuple);
      map.fitBounds(bounds);
    }
  }, [map, plots]);
  
  return null;
}

const PlotMap = ({
  plots = [],
  height = '400px',
  width = '100%',
  center = [29.1368, 76.6425], // Default center of Mahendragarh district
  zoom = 12,
  onPlotClick,
  showAllPlots = true
}: PlotMapProps) => {
  const [selectedPlot, setSelectedPlot] = useState<PlotLocation | null>(null);
  
  const handlePlotClick = (plot: PlotLocation) => {
    setSelectedPlot(plot);
    if (onPlotClick) {
      onPlotClick(plot);
    }
  };
  
  const getStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Set a container style
  const containerStyle = {
    height,
    width,
  };
  
  return (
    <div style={containerStyle} className="rounded-lg overflow-hidden border border-neutral-200">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {plots && plots.map((plot) => (
          <Marker 
            key={plot.id}
            position={[plot.latitude, plot.longitude]}
            icon={getStatusIcon(plot.status)}
            eventHandlers={{
              click: () => handlePlotClick(plot)
            }}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-semibold text-sm">{plot.plotId}</h3>
                <p className="text-xs text-neutral-600">Owner: {plot.ownerName}</p>
                {plot.villageName && (
                  <p className="text-xs text-neutral-600">Village: {plot.villageName}</p>
                )}
                <div className="mt-1 flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                    plot.status === 'completed' ? 'bg-green-500' :
                    plot.status === 'in_progress' ? 'bg-blue-500' :
                    plot.status === 'pending' ? 'bg-orange-500' :
                    plot.status === 'disputed' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></span>
                  <span className="text-xs font-medium">
                    {getStatusText(plot.status)}
                  </span>
                </div>
                {plot.lastUpdated && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Updated: {new Date(plot.lastUpdated).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {showAllPlots && plots && plots.length > 1 && (
          <SetMapBounds plots={plots} />
        )}
      </MapContainer>
    </div>
  );
};

export default PlotMap;
