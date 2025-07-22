import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { FileDown, Loader2 } from 'lucide-react';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Admin-specific components
import AdminStatsSection from '@/components/admin/stats-section';
import StatusCharts from '@/components/admin/status-charts';
import OfficerPerformance from '@/components/admin/officer-performance';
import ReportsSection from '@/components/admin/reports-section';

// Admin API functions
import { 
  fetchAdminStats, 
  fetchStatusDistribution,
  fetchCircleDistribution,
  fetchVillageDistribution,
  fetchOfficerPerformance,
  generateReport,
  AdminStats,
  OfficerPerformance as OfficerPerformanceType,
  StatusBreakdown
} from '@/api/admin';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, hasAdminAccess } = useAuth();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if not authenticated or no admin access
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !hasAdminAccess)) {
      toast({
        title: "Unauthorized",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [isAuthenticated, isLoading, hasAdminAccess, toast]);

  // Fetch admin statistics
  const { 
    data: stats, 
    isLoading: statsLoading 
  } = useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
    enabled: isAuthenticated && hasAdminAccess,
  });

  // Fetch plot status distribution for charts
  const { 
    data: statusData, 
    isLoading: statusLoading 
  } = useQuery<StatusBreakdown[]>({
    queryKey: ['admin', 'status-distribution'],
    queryFn: fetchStatusDistribution,
    enabled: isAuthenticated && hasAdminAccess,
  });

  // Fetch circle-wise distribution for charts
  const { 
    data: circleData, 
    isLoading: circleLoading 
  } = useQuery<StatusBreakdown[]>({
    queryKey: ['admin', 'circle-distribution'],
    queryFn: fetchCircleDistribution,
    enabled: isAuthenticated && hasAdminAccess,
  });

  // Fetch village-wise distribution for charts
  const { 
    data: villageData, 
    isLoading: villageLoading 
  } = useQuery<StatusBreakdown[]>({
    queryKey: ['admin', 'village-distribution'],
    queryFn: fetchVillageDistribution,
    enabled: isAuthenticated && hasAdminAccess,
  });

  // Fetch officer performance data
  const { 
    data: officerData, 
    isLoading: officerLoading 
  } = useQuery<OfficerPerformanceType[]>({
    queryKey: ['admin', 'officer-performance'],
    queryFn: fetchOfficerPerformance,
    enabled: isAuthenticated && hasAdminAccess,
  });

  // Handle report generation
  const handleGenerateReport = async (reportType: string, format: string, dateRange?: { from: Date; to: Date }) => {
    try {
      setIsGeneratingReport(true);
      
      const reportBlob = await generateReport(reportType, format, dateRange);
      
      // Create a download link
      const url = window.URL.createObjectURL(reportBlob);
      const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format}`;
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Generated",
        description: `Your ${reportType} report has been downloaded.`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Handle exporting officer data
  const handleExportOfficerData = async () => {
    try {
      setIsGeneratingReport(true);
      const reportBlob = await generateReport('officerPerformance', 'csv');
      
      const url = window.URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `officer_performance_${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Officer performance data has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Display loading state
  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 h-32"></div>
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
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-3xl font-bold text-neutral-800">
                Administration Dashboard
              </h1>
              <Button variant="outline" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                Export All Data
              </Button>
            </div>
            <p className="text-neutral-600">
              Comprehensive reporting and management for the Land Demarcation Tracker
            </p>
          </div>

          {/* Tab navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="officers">Officer Performance</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab - Statistics and Charts */}
            <TabsContent value="overview" className="space-y-6">
              {stats && <AdminStatsSection stats={stats} />}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Status charts */}
                {statusData && circleData && villageData && (
                  <StatusCharts 
                    statusData={statusData} 
                    circleData={circleData}
                    villageData={villageData}
                  />
                )}
                
                {/* Recent activity card */}
                <Card className="shadow-sm border border-neutral-100">
                  <CardHeader className="border-b border-neutral-100">
                    <CardTitle className="text-lg font-semibold text-neutral-800">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Add recent activity items here */}
                      <p className="text-neutral-600">Loading recent activities...</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Officers Tab - Performance Metrics */}
            <TabsContent value="officers">
              {officerData ? (
                <OfficerPerformance 
                  officers={officerData}
                  onExportOfficerData={handleExportOfficerData} 
                />
              ) : (
                <Card className="shadow-sm border border-neutral-100">
                  <CardContent className="p-6 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Reports Tab - Generate Reports */}
            <TabsContent value="reports">
              <ReportsSection 
                isLoading={isGeneratingReport}
                onGenerateReport={handleGenerateReport}
              />
            </TabsContent>
            
            {/* Analytics Tab - Advanced Charts */}
            <TabsContent value="analytics">
              <Card className="shadow-sm border border-neutral-100">
                <CardHeader className="border-b border-neutral-100">
                  <CardTitle className="text-lg font-semibold text-neutral-800">Advanced Analytics</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-neutral-600">
                    Advanced analytics features will be available soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
