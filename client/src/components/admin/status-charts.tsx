import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface StatusBreakdown {
  name: string;
  count: number;
}

interface StatusChartProps {
  statusData: StatusBreakdown[];
  circleData: StatusBreakdown[];
  villageData: StatusBreakdown[];
}

export default function StatusCharts({ statusData, circleData, villageData }: StatusChartProps) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];
  
  return (
    <Card className="shadow-sm border border-neutral-100">
      <CardHeader className="border-b border-neutral-100">
        <CardTitle className="text-lg font-semibold text-neutral-800">Data Visualization</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-1 xs:grid-cols-3 gap-1">
            <TabsTrigger value="status">Status Distribution</TabsTrigger>
            <TabsTrigger value="circle">Circle-wise</TabsTrigger>
            <TabsTrigger value="village">Village-wise</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} plots`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-neutral-500 text-center">
              Current distribution of plot statuses across the district
            </div>
          </TabsContent>
          
          <TabsContent value="circle">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={circleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Number of Plots" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-neutral-500 text-center">
              Distribution of plots by revenue circle
            </div>
          </TabsContent>
          
          <TabsContent value="village">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={villageData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Number of Plots" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-neutral-500 text-center">
              Top 10 villages by number of plots
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
