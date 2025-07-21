import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/navbar";
import StatsCard from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, CheckCircle, Gauge, AlertTriangle, FileText } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/demarcation-logs"],
    enabled: isAuthenticated,
  });

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">Dashboard Overview</h1>
            <p className="text-neutral-600">Track your demarcation activities and pending cases</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Assigned Plots"
              value={stats?.assignedPlots || 0}
              icon={MapPin}
              iconColor="bg-primary/10 text-primary"
              trend={{ value: "+12%", label: "from last month", isPositive: true }}
            />
            
            <StatsCard
              title="Pending Cases"
              value={stats?.pendingCases || 0}
              icon={Clock}
              iconColor="bg-accent/10 text-accent"
              trend={{ value: "-3", label: "from yesterday", isPositive: true }}
            />
            
            <StatsCard
              title="Completed Today"
              value={stats?.completedToday || 0}
              icon={CheckCircle}
              iconColor="bg-secondary/10 text-secondary"
              trend={{ value: "+2", label: "from target", isPositive: true }}
            />
            
            <StatsCard
              title="Resolution Rate"
              value={`${stats?.resolutionRate || 0}%`}
              icon={Gauge}
              iconColor="bg-purple-600/10 text-purple-600"
              trend={{ value: "+5%", label: "this quarter", isPositive: true }}
            />
          </div>

          {/* Recent Activities and Priority Actions */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Activities */}
            <Card className="shadow-sm border border-neutral-100">
              <CardHeader className="border-b border-neutral-100">
                <CardTitle className="text-lg font-semibold text-neutral-800">Recent Activities</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {logsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 bg-neutral-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentLogs && recentLogs.length > 0 ? (
                  <div className="space-y-4">
                    {recentLogs.slice(0, 3).map((log: any) => (
                      <div key={log.id} className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="text-secondary text-sm" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-800">
                            {log.activityType.replace('_', ' ')} activity completed
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {new Date(log.activityDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                    <p className="text-neutral-500">No recent activities</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Priority Actions */}
            <Card className="shadow-sm border border-neutral-100">
              <CardHeader className="border-b border-neutral-100">
                <CardTitle className="text-lg font-semibold text-neutral-800">Priority Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">High Priority Cases</p>
                      <p className="text-xs text-red-600">Review overdue plots</p>
                    </div>
                    <Button size="sm" variant="destructive">
                      Review
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">Pending Verifications</p>
                      <p className="text-xs text-amber-600">Final checks needed</p>
                    </div>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                      Check
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">Duplicate Reviews</p>
                      <p className="text-xs text-blue-600">Verify duplicate entries</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Verify
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
