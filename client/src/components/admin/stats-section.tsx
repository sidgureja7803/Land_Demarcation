import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  TrendingUp,
  Users,
  BarChart4
} from "lucide-react";

interface AdminStat {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  trend?: {
    value: string;
    label: string;
    isPositive: boolean;
  };
}

interface AdminStatsProps {
  stats: {
    totalPlots: number;
    completedPlots: number;
    pendingPlots: number;
    activeOfficers: number;
    totalVillages: number;
    duplicates: number;
    averageResolutionTime: string;
    completionRate: string;
  };
}

export default function AdminStatsSection({ stats }: AdminStatsProps) {
  const adminStats: AdminStat[] = [
    {
      title: "Total Plots",
      value: stats.totalPlots,
      icon: MapPin,
      iconColor: "bg-primary/10 text-primary",
      trend: { value: "+12%", label: "from last month", isPositive: true },
    },
    {
      title: "Completion Rate",
      value: stats.completionRate,
      icon: CheckCircle2,
      iconColor: "bg-green-600/10 text-green-600",
      trend: { value: "+5%", label: "this quarter", isPositive: true },
    },
    {
      title: "Active Officers",
      value: stats.activeOfficers,
      icon: Users,
      iconColor: "bg-accent/10 text-accent",
      trend: { value: "+2", label: "since last week", isPositive: true },
    },
    {
      title: "Pending Cases",
      value: stats.pendingPlots,
      icon: Clock,
      iconColor: "bg-amber-500/10 text-amber-500",
      trend: { value: "-3%", label: "from yesterday", isPositive: true },
    },
    {
      title: "Villages Covered",
      value: stats.totalVillages,
      icon: BarChart4,
      iconColor: "bg-secondary/10 text-secondary",
      trend: { value: "+3", label: "this month", isPositive: true },
    },
    {
      title: "Flagged Duplicates",
      value: stats.duplicates,
      icon: AlertTriangle,
      iconColor: "bg-red-500/10 text-red-500",
      trend: { value: "-2", label: "this week", isPositive: true },
    },
    {
      title: "Avg. Resolution Time",
      value: stats.averageResolutionTime,
      icon: Activity,
      iconColor: "bg-blue-500/10 text-blue-500",
      trend: { value: "-12%", label: "improvement", isPositive: true },
    },
    {
      title: "Processed This Month",
      value: stats.completedPlots,
      icon: TrendingUp,
      iconColor: "bg-purple-600/10 text-purple-600",
      trend: { value: "+8", label: "from last month", isPositive: true },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {adminStats.map((stat, index) => (
        <Card key={index} className="shadow-sm border border-neutral-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-full ${stat.iconColor}`}>
                {React.createElement(stat.icon, { className: "h-5 w-5" })}
              </div>
              {stat.trend && (
                <div className={`text-xs ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend.value} {stat.trend.label}
                </div>
              )}
            </div>
            <div className="mt-3">
              <p className="text-sm text-neutral-600">{stat.title}</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">{stat.value}</h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
