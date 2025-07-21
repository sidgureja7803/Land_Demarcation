import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    label: string;
    isPositive: boolean;
  };
  iconColor: string;
}

export default function StatsCard({ title, value, icon: Icon, trend, iconColor }: StatsCardProps) {
  return (
    <Card className="bg-white shadow-sm border border-neutral-100">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-600">{title}</p>
            <p className="text-2xl font-bold text-neutral-800 mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 ${iconColor} rounded-lg flex items-center justify-center`}>
            <Icon className="text-xl" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </span>
            <span className="text-neutral-500 ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
