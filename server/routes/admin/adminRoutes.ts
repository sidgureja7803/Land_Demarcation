import express, { Request, Response } from 'express';
import { storage } from '../../storage';
import { adminStorage } from '../../storage.extension';
import { format, parseISO } from 'date-fns';
import { isAuthenticated, isAdmin } from '../../middleware/shared/authMiddleware';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// All admin routes require authentication and admin access
router.use(isAuthenticated);
router.use(isAdmin);

// Get admin dashboard statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await adminStorage.getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin dashboard statistics' });
  }
});

// Get plot status distribution for charts
router.get('/status-distribution', async (req: Request, res: Response) => {
  try {
    const statusDistribution = await adminStorage.getStatusDistribution();
    res.json(statusDistribution);
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    res.status(500).json({ error: 'Failed to fetch status distribution data' });
  }
});

// Get circle-wise plot distribution for charts
router.get('/circle-distribution', async (req: Request, res: Response) => {
  try {
    const circleDistribution = await adminStorage.getCircleDistribution();
    res.json(circleDistribution);
  } catch (error) {
    console.error('Error fetching circle distribution:', error);
    res.status(500).json({ error: 'Failed to fetch circle distribution data' });
  }
});

// Get village-wise plot distribution for charts
router.get('/village-distribution', async (req: Request, res: Response) => {
  try {
    const villageDistribution = await adminStorage.getVillageDistribution();
    res.json(villageDistribution);
  } catch (error) {
    console.error('Error fetching village distribution:', error);
    res.status(500).json({ error: 'Failed to fetch village distribution data' });
  }
});

// Get officer performance metrics
router.get('/officer-performance', async (req: Request, res: Response) => {
  try {
    const officerPerformance = await adminStorage.getOfficerPerformance();
    res.json(officerPerformance);
  } catch (error) {
    console.error('Error fetching officer performance:', error);
    res.status(500).json({ error: 'Failed to fetch officer performance data' });
  }
});

// Get ADC performance metrics
router.get('/adc-performance', async (req: Request, res: Response) => {
  try {
    const adcPerformance = await adminStorage.getADCPerformance();
    res.json(adcPerformance);
  } catch (error) {
    console.error('Error fetching ADC performance:', error);
    res.status(500).json({ error: 'Failed to fetch ADC performance data' });
  }
});

// Generate and download reports (CSV)
router.get('/reports/csv', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, reportType } = req.query;
    
    if (!startDate || !endDate || !reportType) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }
    
    let data;
    switch (reportType) {
      case 'plots':
        data = await adminStorage.getPlotsReport(startDate as string, endDate as string);
        break;
      case 'officers':
        data = await adminStorage.getOfficersReport(startDate as string, endDate as string);
        break;
      case 'citizens':
        data = await adminStorage.getCitizensReport(startDate as string, endDate as string);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }
    
    generateCSV(res, data, reportType as string);
  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Generate and download reports (PDF)
router.get('/reports/pdf', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, reportType } = req.query;
    
    if (!startDate || !endDate || !reportType) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }
    
    // This would typically use a PDF generation library
    // For now, just return a placeholder message
    res.status(501).json({ message: 'PDF generation not yet implemented' });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Helper function to generate CSV report
function generateCSV(res: Response, data: any[], reportType: string) {
  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  
  // Create CSV header
  const headers = Object.keys(data[0] || {});
  const csvHeader = headers.join(',') + '\n';
  
  // Create CSV rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      // Handle special case for date fields
      const value = row[header];
      if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
        return `"${format(typeof value === 'string' ? parseISO(value) : value, 'yyyy-MM-dd')}"`;
      }
      // Escape strings with quotes if they contain commas
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(',');
  }).join('\n');
  
  // Send CSV data
  res.send(csvHeader + csvRows);
}

export default router;
