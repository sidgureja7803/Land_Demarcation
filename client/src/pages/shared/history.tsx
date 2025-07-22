import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertTriangle, MapPin, User, Calendar } from "lucide-react";

interface HistoryProps {
  userType?: 'citizen' | 'officer' | 'admin';
  adminView?: boolean;
}

export default function History({ userType = 'officer', adminView = false }: HistoryProps) {
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

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/demarcation-logs"],
    enabled: isAuthenticated,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-600" />;
      case "in_progress":
        return <Clock className="text-blue-600" />;
      case "pending":
        return <Clock className="text-yellow-600" />;
      case "disputed":
        return <AlertTriangle className="text-red-600" />;
      case "on_hold":
        return <AlertTriangle className="text-gray-600" />;
      default:
        return <Clock className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "disputed":
        return "bg-red-100 text-red-800";
      case "on_hold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityTypeDisplay = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading || logsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
              <div className="bg-white rounded-xl p-6">
                <div className="space-y-8">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-neutral-200 rounded-full"></div>
                      <div className="flex-1 bg-neutral-100 rounded-lg p-6">
                        <div className="h-6 bg-neutral-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">Demarcation History</h1>
            <p className="text-neutral-600">View historical and current demarcation records</p>
          </div>

          {/* Timeline View */}
          <Card className="shadow-sm border border-neutral-100">
            <CardContent className="p-6">
              {logs && logs.length > 0 ? (
                <div className="space-y-8">
                  {logs.map((log: any, index: number) => (
                    <div key={log.id} className="relative">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-white border-2 border-neutral-200 rounded-full flex items-center justify-center">
                          {getStatusIcon(log.currentStatus)}
                        </div>
                        
                        <div className="flex-1 bg-neutral-50 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-neutral-800">
                                {getActivityTypeDisplay(log.activityType)}
                              </h4>
                              <p className="text-sm text-neutral-600 mt-1">
                                Plot ID: {log.plotId}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(log.currentStatus)}>
                                {log.currentStatus.replace('_', ' ')}
                              </Badge>
                              <p className="text-sm text-neutral-500 mt-1">
                                {new Date(log.activityDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-neutral-700 mb-4">{log.description}</p>
                          
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-neutral-500" />
                              <span className="font-medium text-neutral-600">Officer:</span>
                              <span className="text-neutral-800">{log.officerId}</span>
                            </div>
                            
                            {log.startTime && log.endTime && (
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-neutral-500" />
                                <span className="font-medium text-neutral-600">Duration:</span>
                                <span className="text-neutral-800">
                                  {Math.round((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / (1000 * 60 * 60 * 100)) / 10} hours
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-neutral-500" />
                              <span className="font-medium text-neutral-600">Priority:</span>
                              <span className="text-neutral-800 capitalize">{log.priority}</span>
                            </div>
                          </div>
                          
                          {log.issuesEncountered && (
                            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <h5 className="text-sm font-medium text-yellow-800 mb-1">Issues Encountered:</h5>
                              <p className="text-xs text-yellow-700">{log.issuesEncountered}</p>
                            </div>
                          )}
                          
                          {log.nextSteps && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <h5 className="text-sm font-medium text-blue-800 mb-1">Next Steps:</h5>
                              <p className="text-xs text-blue-700">{log.nextSteps}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Timeline connector */}
                      {index < logs.length - 1 && (
                        <div className="absolute left-5 top-12 w-0.5 h-8 bg-neutral-200"></div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Calendar className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-600 mb-2">No History Found</h3>
                  <p className="text-neutral-500">
                    Start creating demarcation logs to see your activity history here.
                  </p>
                </div>
              )}
              
              {/* Load More - if needed in future */}
              {logs && logs.length >= 10 && (
                <div className="text-center mt-8">
                  <Button variant="outline">
                    Load More History
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
