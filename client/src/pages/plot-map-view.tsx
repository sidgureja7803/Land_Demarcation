import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/navbar';
import PlotMap, { PlotLocation } from '@/components/plot-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Filter } from 'lucide-react';

interface PlotMapViewProps {
  readonly userType?: 'citizen' | 'officer' | 'admin';
}

export default function PlotMapView({ userType = 'officer' }: PlotMapViewProps) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPlot, setSelectedPlot] = useState<PlotLocation | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: 'Unauthorized',
        description: 'You are logged out. Logging in again...',
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch plots data
  const { data: plots, isLoading: plotsLoading } = useQuery<PlotLocation[], Error>({
    queryKey: ['/api/plots'],
    enabled: isAuthenticated,
  });

  // Filter plots based on search query and status filter
  const filteredPlots = plots?.filter(plot => {
    const matchesSearch = 
      searchQuery === '' || 
      plot.plotId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plot.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plot.villageName && plot.villageName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || plot.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Mock plot location data for testing until we get real data from the API
  const mockPlots: PlotLocation[] = [
    {
      id: 1,
      plotId: 'MAH-2023-001',
      ownerName: 'Raj Kumar',
      latitude: 28.1210,
      longitude: 76.6313,
      status: 'completed',
      villageName: 'Narnaul',
      circleName: 'Narnaul Circle',
      area: 3.5,
      lastUpdated: '2023-12-15T10:30:00'
    },
    {
      id: 2,
      plotId: 'MAH-2023-002',
      ownerName: 'Sunita Devi',
      latitude: 28.1480,
      longitude: 76.6220,
      status: 'in_progress',
      villageName: 'Mahendragarh',
      circleName: 'Mahendragarh Circle',
      area: 2.7,
      lastUpdated: '2023-12-10T14:15:00'
    },
    {
      id: 3,
      plotId: 'MAH-2023-003',
      ownerName: 'Anil Singh',
      latitude: 28.0990,
      longitude: 76.5890,
      status: 'pending',
      villageName: 'Ateli',
      circleName: 'Ateli Circle',
      area: 4.2,
      lastUpdated: '2023-12-05T09:45:00'
    },
    {
      id: 4,
      plotId: 'MAH-2023-004',
      ownerName: 'Meena Kumari',
      latitude: 28.1320,
      longitude: 76.6110,
      status: 'disputed',
      villageName: 'Kanina',
      circleName: 'Kanina Circle',
      area: 1.8,
      lastUpdated: '2023-12-12T16:20:00'
    },
    {
      id: 5,
      plotId: 'MAH-2023-005',
      ownerName: 'Ramesh Chand',
      latitude: 28.1150,
      longitude: 76.6450,
      status: 'on_hold',
      villageName: 'Nangal Choudhary',
      circleName: 'Nangal Circle',
      area: 3.1,
      lastUpdated: '2023-12-08T11:10:00'
    }
  ];

  // Use real data if available, otherwise use mock data
  const displayPlots = filteredPlots || mockPlots;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      case 'on_hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePlotClick = (plot: PlotLocation) => {
    setSelectedPlot(plot);
  };

  if (isLoading || plotsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
              <div className="h-[400px] bg-neutral-200 rounded-lg mb-6"></div>
              <div className="grid md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-neutral-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">Plot Locations</h1>
            <p className="text-neutral-600">View and monitor land demarcation plots across the district</p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
              <Input
                placeholder="Search by plot ID, owner name or village..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-64">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter size={16} className="mr-2 text-neutral-500" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Map Container - Takes 2/3 of the width */}
            <div className="md:col-span-2">
              <Card className="shadow-sm border border-neutral-100 h-full">
                <CardHeader className="border-b border-neutral-100 py-4">
                  <CardTitle className="text-lg font-semibold text-neutral-800">Plot Map</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <PlotMap 
                    plots={displayPlots} 
                    height="500px" 
                    onPlotClick={handlePlotClick}
                    showAllPlots
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Plot Details Panel - Takes 1/3 of the width */}
            <div>
              <Card className="shadow-sm border border-neutral-100">
                <CardHeader className="border-b border-neutral-100 py-4">
                  <CardTitle className="text-lg font-semibold text-neutral-800">
                    {selectedPlot ? 'Plot Details' : 'Select a Plot'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {selectedPlot ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{selectedPlot.plotId}</h3>
                          <p className="text-sm text-neutral-600">{selectedPlot.ownerName}</p>
                        </div>
                        <Badge className={getStatusColor(selectedPlot.status)}>
                          {selectedPlot.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="border-t border-b border-neutral-100 py-4 space-y-3">
                        {selectedPlot.villageName && (
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-500">Village:</span>
                            <span className="text-sm font-medium">{selectedPlot.villageName}</span>
                          </div>
                        )}
                        {selectedPlot.circleName && (
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-500">Circle:</span>
                            <span className="text-sm font-medium">{selectedPlot.circleName}</span>
                          </div>
                        )}
                        {selectedPlot.area && (
                          <div className="flex justify-between">
                            <span className="text-sm text-neutral-500">Area:</span>
                            <span className="text-sm font-medium">{selectedPlot.area} acres</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-500">Coordinates:</span>
                          <span className="text-sm font-medium">
                            {selectedPlot.latitude.toFixed(4)}, {selectedPlot.longitude.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      
                      {selectedPlot.lastUpdated && (
                        <div className="text-xs text-neutral-500">
                          Last updated: {new Date(selectedPlot.lastUpdated).toLocaleDateString()}
                        </div>
                      )}
                      
                      <div className="pt-2 flex gap-2">
                        <Button size="sm" className="w-full">View History</Button>
                        {userType !== 'citizen' && (
                          <Button size="sm" variant="outline" className="w-full">Add Log</Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-80 text-center p-4">
                      <MapPin className="text-neutral-300 h-16 w-16 mb-4" />
                      <h3 className="text-neutral-600 font-medium mb-2">No Plot Selected</h3>
                      <p className="text-neutral-500 text-sm">
                        Click on any plot marker on the map to view its details here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Plot List */}
              <Card className="shadow-sm border border-neutral-100 mt-6">
                <CardHeader className="border-b border-neutral-100 py-4">
                  <CardTitle className="text-lg font-semibold text-neutral-800">Recent Plots</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-neutral-100">
                    {displayPlots.slice(0, 5).map((plot) => (
                      <div 
                        key={plot.id} 
                        className={`p-3 hover:bg-neutral-50 cursor-pointer ${selectedPlot?.id === plot.id ? 'bg-neutral-50' : ''}`}
                        onClick={() => setSelectedPlot(plot)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{plot.plotId}</p>
                            <p className="text-xs text-neutral-600">{plot.villageName || 'Unknown location'}</p>
                          </div>
                          <Badge className={getStatusColor(plot.status)}>
                            {plot.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
