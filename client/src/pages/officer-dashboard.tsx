import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  MapPin, Clock, FileText, FileCheck, Map, Loader2, 
  PieChart, Calendar, CheckCircle2, Clock2, AlertCircle, Users
} from "lucide-react";
import Link from "@/components/link";
import Navbar from "@/components/navbar";
import PlotsMapDisplay from "@/components/plots-map-display";
import { fetchAllPlots } from "@/api/plots";
import { Plot } from "@/types/plots";
import { format } from "date-fns";

// Define types for the officer dashboard
interface OfficerStats {
  totalPlots: number;
  pendingReview: number;
  inProgress: number;
  completedToday: number;
  resolutionRate: number;
}

const OfficerDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [stats, setStats] = useState<OfficerStats>({
    totalPlots: 0,
    pendingReview: 0,
    inProgress: 0,
    completedToday: 0,
    resolutionRate: 0
  });

  // Fetch all plots (officer view shows all plots)
  const { data: plots, isLoading: loadingPlots } = useQuery<Plot[]>({
    queryKey: ['plots'],
    queryFn: fetchAllPlots,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error('Failed to fetch plots:', error);
      toast({
        title: "Error loading plot data",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  });

  // Calculate officer statistics from plots
  useEffect(() => {
    if (plots && plots.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate statistics from plots data
      const pendingCount = plots.filter(plot => plot.status === 'pending').length;
      const inProgressCount = plots.filter(plot => plot.status === 'in_progress').length;
      
      // Count plots completed today
      const completedToday = plots.filter(plot => {
        return plot.status === 'completed' && 
               plot.lastUpdated && 
               plot.lastUpdated.toString().split('T')[0] === today;
      }).length;
      
      // Calculate resolution rate (completed / total)
      const completedTotal = plots.filter(plot => plot.status === 'completed').length;
      const resolutionRate = plots.length > 0 
        ? Math.round((completedTotal / plots.length) * 100) 
        : 0;
      
      setStats({
        totalPlots: plots.length,
        pendingReview: pendingCount,
        inProgress: inProgressCount,
        completedToday,
        resolutionRate
      });
    }
  }, [plots]);

  // Group plots by village for analysis
  const plotsByVillage = plots?.reduce((acc, plot) => {
    const village = plot.villageName || 'Unknown';
    if (!acc[village]) {
      acc[village] = [];
    }
    acc[village].push(plot);
    return acc;
  }, {} as Record<string, Plot[]>) || {};

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 p-6 lg:px-8">
        {/* Header */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Officer Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Mahendragarh Land Demarcation Portal - {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </section>

        {/* Quick Action Buttons */}
        <section className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <Button asChild className="flex items-center gap-2 whitespace-nowrap">
            <Link href="/applications">
              <FileText className="h-4 w-4" />
              Review Applications
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex items-center gap-2 whitespace-nowrap">
            <Link href="/new-log">
              <FileCheck className="h-4 w-4" />
              Process Application
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex items-center gap-2 whitespace-nowrap">
            <Link href="/map">
              <Map className="h-4 w-4" />
              Full Map View
            </Link>
          </Button>
        </section>

        {/* Stats Overview */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Plots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingPlots ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalPlots}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold">
                  {loadingPlots ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.pendingReview}
                </div>
                {stats.pendingReview > 0 && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                    Requires Action
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingPlots ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.completedToday}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolution Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingPlots ? <Loader2 className="h-6 w-6 animate-spin" /> : `${stats.resolutionRate}%`}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Map and Applications Grid */}
        <div className="grid gap-6 lg:grid-cols-5 mb-8">
          {/* Map */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Plot Locations</CardTitle>
              <CardDescription>All plots in the district</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loadingPlots ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : stats.totalPlots > 0 ? (
                <PlotsMapDisplay userType="officer" height="400px" showAllPlots />
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <MapPin className="text-neutral-300 h-12 w-12 mb-2" />
                  <p className="text-muted-foreground">No plots available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Applications */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
              <CardDescription>Applications awaiting your review</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPlots ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : plots && plots.filter(p => p.status === 'pending').length > 0 ? (
                <div className="space-y-4">
                  {plots
                    .filter(plot => plot.status === 'pending')
                    .slice(0, 5)
                    .map(plot => (
                      <div key={plot.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                        <div>
                          <div className="font-medium">{plot.plotId || `Plot #${plot.id}`}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            {plot.ownerName || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {plot.villageName || 'Unknown location'}
                          </div>
                        </div>
                        <div>
                          <Button size="sm" asChild>
                            <Link href={`/applications/${plot.id}`}>
                              Review
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  
                  {plots.filter(p => p.status === 'pending').length > 5 && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/applications?status=pending">
                        View All Pending
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <p className="text-muted-foreground">No pending applications</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Village Analysis */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Village Analysis</CardTitle>
              <CardDescription>Plot distribution by village</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPlots ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : Object.keys(plotsByVillage).length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(plotsByVillage)
                    .sort((a, b) => b[1].length - a[1].length) // Sort by plot count
                    .map(([village, villagePlots]) => {
                      const pendingCount = villagePlots.filter(p => p.status === 'pending').length;
                      const inProgressCount = villagePlots.filter(p => p.status === 'in_progress').length;
                      const completedCount = villagePlots.filter(p => p.status === 'completed').length;
                      
                      return (
                        <Card key={village}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{village}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold mb-2">{villagePlots.length} plots</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 text-yellow-500" /> Pending
                                </span>
                                <span>{pendingCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="flex items-center gap-1">
                                  <Clock2 className="h-3 w-3 text-blue-500" /> In Progress
                                </span>
                                <span>{inProgressCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" /> Completed
                                </span>
                                <span>{completedCount}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-10 w-10 mx-auto text-neutral-300 mb-2" />
                  <p className="text-muted-foreground">No data available for analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default OfficerDashboard;
