import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfficerPerformance {
  id: string;
  name: string;
  circle: string;
  completedPlots: number;
  pendingPlots: number;
  efficiency: number;
  avgTimePerPlot: string;
  lastActivity: string;
}

interface OfficerPerformanceProps {
  officers: OfficerPerformance[];
  onExportOfficerData: () => void;
}

export default function OfficerPerformance({ officers, onExportOfficerData }: OfficerPerformanceProps) {
  return (
    <Card className="shadow-sm border border-neutral-100">
      <CardHeader className="border-b border-neutral-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-neutral-800">Officer Performance</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" onClick={onExportOfficerData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-w-full">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Officer</TableHead>
                <TableHead>Circle</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Efficiency</TableHead>
                <TableHead>Avg. Time</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officers.map((officer) => (
                <TableRow key={officer.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {officer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{officer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{officer.circle}</TableCell>
                  <TableCell>{officer.completedPlots}</TableCell>
                  <TableCell>{officer.pendingPlots}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={officer.efficiency >= 80 ? "outline" : "secondary"}
                      className={
                        officer.efficiency >= 80 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : officer.efficiency >= 50 
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {officer.efficiency}%
                    </Badge>
                  </TableCell>
                  <TableCell>{officer.avgTimePerPlot}</TableCell>
                  <TableCell className="text-neutral-500">{officer.lastActivity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
