import { useEffect, useState } from "react";
import { useLocation, useRedirect } from "wouter";
import { Activity, BadgeCheck, Calendar, Clock, ClockIcon, FileSpreadsheet, History, LayoutGrid, List, Map, MapPin, MonitorSmartphone, Package, PieChart, Trash, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { UserCard } from "@/components/user-card";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PlotMap } from "@/components/plot-map";
import { fetchAllPlots } from "@/api/plots";
import { Plot } from "@/types/plots";
import Link from "@/components/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/navbar";
import StatsCard from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, CheckCircle, Gauge, AlertTriangle, FileText, FilePlus, FileCheck, User, Settings, Map } from "lucide-react";
import { Link } from "wouter";
import PlotMap from "@/components/plot-map";
import PlotsMapDisplay from "@/components/plots-map-display";

// Define types for the dashboard stats and logs data
interface DashboardStats {
  assignedPlots: number;
  pendingCases: number;
  completedToday: number;
  resolutionRate: number;
}

interface DemarcationLog {
  id: number;
  activityType: string;
  activityDate: string;
  currentStatus: string;
  description: string;
  plotId: number;
  officerId?: string;
}

interface DashboardProps {
  readonly userType?: 'citizen' | 'officer' | 'admin';
  readonly adminView?: boolean;
}

export default function Dashboard({ userType = 'officer', adminView = false }: DashboardProps) {
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

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats, Error>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: recentLogs, isLoading: logsLoading } = useQuery<DemarcationLog[], Error>({
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
                {Array.from({ length: 4 }).map((_, i) => (
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
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">
              {userType === 'citizen' ? 'Application Dashboard' : 
               userType === 'admin' && adminView ? 'Admin Dashboard' : 'Dashboard Overview'}
            </h1>
            <p className="text-neutral-600">
              {userType === 'citizen' ? 'Track your land demarcation applications and status' : 
               userType === 'admin' ? 'Manage district-wide demarcation activities' : 
               'Track your demarcation activities and pending cases'}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {userType === 'citizen' ? (
              <>
                <StatsCard
                  title="Total Applications"
                  value={stats?.assignedPlots || 0}
                  icon={FilePlus}
                  iconColor="bg-primary/10 text-primary"
                  trend={{ value: "", label: "application(s)", isPositive: true }}
                />
                
                <StatsCard
                  title="In Progress"
                  value={stats?.pendingCases || 0}
                  icon={Clock}
                  iconColor="bg-accent/10 text-accent"
                  trend={{ value: "", label: "application(s)", isPositive: false }}
                />
                
                <StatsCard
                  title="Completed"
                  value={stats?.completedToday || 0}
                  icon={FileCheck}
                  iconColor="bg-secondary/10 text-secondary"
                  trend={{ value: "", label: "application(s)", isPositive: true }}
                />
                
                <StatsCard
                  title="Updates Available"
                  value={2}
                  icon={AlertTriangle}
                  iconColor="bg-purple-600/10 text-purple-600"
                  trend={{ value: "", label: "new update(s)", isPositive: false }}
                />
              </>
            ) : userType === 'admin' && adminView ? (
              <>
                <StatsCard
                  title="Total Plots"
                  value={stats?.assignedPlots || 0}
                  icon={MapPin}
                  iconColor="bg-primary/10 text-primary"
                  trend={{ value: "+12%", label: "from last month", isPositive: true }}
                />
                
                <StatsCard
                  title="Active Officers"
                  value={14}
                  icon={User}
                  iconColor="bg-accent/10 text-accent"
                  trend={{ value: "+2", label: "since last week", isPositive: true }}
                />
                
                <StatsCard
                  title="District Coverage"
                  value="87%"
                  icon={Gauge}
                  iconColor="bg-secondary/10 text-secondary"
                  trend={{ value: "+5%", label: "this quarter", isPositive: true }}
                />
                
                <StatsCard
                  title="Flagged Duplicates"
                  value={7}
                  icon={AlertTriangle}
                  iconColor="bg-purple-600/10 text-purple-600"
                  trend={{ value: "-2", label: "this week", isPositive: true }}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Action Buttons for Citizens */}
          {userType === 'citizen' && (
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <Link href="/apply">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <FilePlus className="mr-2 h-5 w-5" />
                  New Application
                </Button>
              </Link>
              
              <Link href="/applications">
                <Button size="lg" variant="outline">
                  <FileCheck className="mr-2 h-5 w-5" />
                  View Applications
                </Button>
              </Link>
            </div>
          )}
          
          {/* Admin Control Buttons */}
          {userType === 'admin' && adminView && (
            <div className="flex flex-wrap gap-4 mb-8">
              <Button size="sm" variant="outline" className="bg-white">
                <User className="mr-2 h-4 w-4" />
                Manage Officers
              </Button>
              
              <Button size="sm" variant="outline" className="bg-white">
                <MapPin className="mr-2 h-4 w-4" />
                Circle Summary
              </Button>
              
              <Button size="sm" variant="outline" className="bg-white">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Review Duplicates
              </Button>
              
              <Button size="sm" variant="outline" className="bg-white">
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Button>
            </div>
          )}

          {/* Map Card */}
          <div className="mb-8">
            <Card className="shadow-sm border border-neutral-100">
              <CardHeader className="border-b border-neutral-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-neutral-800">Plot Locations</CardTitle>
                  <Link href="/map" className="text-sm text-primary hover:underline flex items-center">
                    <span>View full map</span>
                    <Map className="ml-1" size={14} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {stats && stats.assignedPlots > 0 ? (
                  <PlotsMapDisplay userType={userType} height="300px" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <MapPin className="text-neutral-300 h-10 w-10 mb-2" />
                    <h3 className="text-neutral-600 font-medium mb-1">No Plots Available</h3>
                    <p className="text-neutral-500 text-sm">
                      {userType === "citizen" ? 
                        "Submit an application to see your plots here." : 
                        "No plots are currently assigned or available."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                    {Array.from({ length: 3 }).map((_, i) => (
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
                    {recentLogs && recentLogs.slice(0, 3).map((log) => (
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
