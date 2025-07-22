import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FilePdf, FileSpreadsheet, Filter, Loader2 } from "lucide-react";
import { DatePicker } from "@/components/date-picker";

interface ReportsSectionProps {
  isLoading: boolean;
  onGenerateReport: (reportType: string, format: string, dateRange?: { from: Date; to: Date }) => void;
}

export default function ReportsSection({ isLoading, onGenerateReport }: ReportsSectionProps) {
  const [reportType, setReportType] = useState<string>('plotStatus');
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    to: new Date()
  });

  const handleGenerateReport = () => {
    onGenerateReport(reportType, exportFormat, dateRange);
  };

  return (
    <Card className="shadow-sm border border-neutral-100">
      <CardHeader className="border-b border-neutral-100">
        <CardTitle className="text-lg font-semibold text-neutral-800">Generate Reports</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Report Type</label>
              <Select 
                value={reportType} 
                onValueChange={setReportType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plotStatus">Plot Status Summary</SelectItem>
                  <SelectItem value="officerActivity">Officer Activity</SelectItem>
                  <SelectItem value="demarcationProgress">Demarcation Progress</SelectItem>
                  <SelectItem value="villageWise">Village-wise Breakdown</SelectItem>
                  <SelectItem value="circleWise">Circle-wise Breakdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Export Format</label>
              <Select 
                value={exportFormat} 
                onValueChange={setExportFormat}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select export format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Date Range</label>
            <div className="flex items-center gap-4">
              <DatePicker 
                selected={dateRange.from} 
                onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                placeholder="From Date" 
              />
              <span className="text-neutral-500">to</span>
              <DatePicker 
                selected={dateRange.to} 
                onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                placeholder="To Date" 
              />
            </div>
          </div>
          
          <Button 
            onClick={handleGenerateReport}
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                {exportFormat === 'pdf' ? (
                  <FilePdf className="mr-2 h-4 w-4" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                Generate {exportFormat.toUpperCase()} Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
