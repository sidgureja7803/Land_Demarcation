import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Clock, FileText, FilePlus, FileCheck, Map, Loader2 } from "lucide-react";
import Link from "@/components/link";
import Navbar from "@/components/navbar";
import PlotsMapDisplay from "@/components/plots-map-display";
import { fetchAllPlots } from "@/api/plots";
import { Plot } from "@/types/plots";

// Define types for the citizen dashboard
interface ApplicationSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
}

const CitizenDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [applicationSummary, setApplicationSummary] = useState<ApplicationSummary>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0
  });

  // Fetch citizen's plots
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

  // Calculate application summary from plots
  useEffect(() => {
    if (plots) {
      const summary = plots.reduce((acc, plot) => {
        acc.total += 1;
        
        switch (plot.status) {
          case 'pending':
            acc.pending += 1;
            break;
          case 'in_progress':
            acc.inProgress += 1;
            break;
          case 'completed':
            acc.completed += 1;
            break;
          case 'rejected':
            acc.rejected += 1;
            break;
        }
        
        return acc;
      }, {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0
      });

      setApplicationSummary(summary);
    }
  }, [plots]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 p-6 lg:px-8">
        {/* Welcome Section */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name || 'Citizen'}</h1>
          <p className="text-muted-foreground mt-2">
            Mahendragarh Land Demarcation Portal - Citizen Dashboard
          </p>
        </section>

        {/* Quick Action Buttons */}
        <section className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <Button asChild className="flex items-center gap-2 whitespace-nowrap">
            <Link href="/apply">
              <FilePlus className="h-4 w-4" />
              New Application
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex items-center gap-2 whitespace-nowrap">
            <Link href="/applications">
              <FileText className="h-4 w-4" />
              My Applications
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex items-center gap-2 whitespace-nowrap">
            <Link href="/map">
              <Map className="h-4 w-4" />
              View Map
            </Link>
          </Button>
        </section>

        {/* Application Status Cards */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingPlots ? <Loader2 className="h-6 w-6 animate-spin" /> : applicationSummary.total}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">
                {loadingPlots ? <Loader2 className="h-6 w-6 animate-spin" /> : applicationSummary.pending}
              </div>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                Awaiting Review
              </Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">
                {loadingPlots ? <Loader2 className="h-6 w-6 animate-spin" /> : applicationSummary.inProgress}
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">
                Processing
              </Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">
                {loadingPlots ? <Loader2 className="h-6 w-6 animate-spin" /> : applicationSummary.completed}
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                Approved
              </Badge>
            </CardContent>
          </Card>
        </section>

        {/* Map Preview */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>My Plot Locations</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loadingPlots ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : applicationSummary.total > 0 ? (
                <PlotsMapDisplay userType="citizen" height="300px" showAllPlots />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <MapPin className="text-neutral-300 h-10 w-10 mb-2" />
                  <p className="text-muted-foreground mb-4">No plot applications found</p>
                  <Button asChild variant="outline">
                    <Link href="/apply">
                      Submit Your First Application
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Recent Applications */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPlots ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : plots && plots.length > 0 ? (
                <div className="space-y-4">
                  {plots.slice(0, 5).map((plot) => (
                    <div key={plot.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <div className="font-medium">{plot.plotId || `Plot #${plot.id}`}</div>
                        <div className="text-sm text-muted-foreground">
                          {plot.villageName} {plot.circleName ? `• ${plot.circleName}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-right">
                          <div className="font-medium">{plot.lastUpdated ? new Date(plot.lastUpdated).toLocaleDateString() : 'N/A'}</div>
                          <div className="text-muted-foreground"><Clock className="inline h-3 w-3 mr-1" /> Last updated</div>
                        </div>
                        <StatusBadge status={plot.status} />
                      </div>
                    </div>
                  ))}
                  
                  {plots.length > 5 && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/applications">
                        View All Applications
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto text-neutral-300 mb-2" />
                  <p className="text-muted-foreground mb-4">No applications yet</p>
                  <Button asChild>
                    <Link href="/apply">
                      Create New Application
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

// Helper component for status badges
const StatusBadge = ({ status }: { status?: string }) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
          Pending
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">
          In Progress
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
          Completed
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          Unknown
        </Badge>
      );
  }
};

export default CitizenDashboard;
