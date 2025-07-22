import express, { Request, Response } from 'express';
import { storage } from '../../storage';
import { adminStorage } from '../../storage.extension';
import { format, parseISO } from 'date-fns';
import { isAuthenticated, isAdmin } from '../../replitAuth';
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

// Get officer performance data
router.get('/officer-performance', async (req: Request, res: Response) => {
  try {
    const officerPerformance = await adminStorage.getOfficerPerformance();
    res.json(officerPerformance);
  } catch (error) {
    console.error('Error fetching officer performance:', error);
    res.status(500).json({ error: 'Failed to fetch officer performance data' });
  }
});

// Generate and download reports
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { type, format } = req.query;
    const fromDate = req.query.fromDate ? parseISO(String(req.query.fromDate)) : null;
    const toDate = req.query.toDate ? parseISO(String(req.query.toDate)) : null;
    
    if (!type || !format) {
      return res.status(400).json({ error: 'Report type and format are required' });
    }
    
    const reportData = await adminStorage.generateReport(
      String(type), 
      fromDate, 
      toDate
    );
    
    if (!reportData || reportData.length === 0) {
      return res.status(404).json({ error: 'No data available for report' });
    }
    
    switch (String(format).toLowerCase()) {
      case 'csv':
        return generateCSV(res, reportData, String(type));
        
      case 'excel':
        return res.status(501).json({ 
          error: 'Excel export is handled client-side. Please use the client-side export functionality.' 
        });
        
      case 'pdf':
        return res.status(501).json({ 
          error: 'PDF export is handled client-side. Please use the client-side export functionality.' 
        });
        
      default:
        return res.status(400).json({ error: 'Invalid format type' });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Helper function to generate CSV report
function generateCSV(res: Response, data: any[], reportType: string) {
  // Get headers
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV format
  let csv = headers.join(',') + '\r\n';
  
  data.forEach((row) => {
    const values = headers.map(header => {
      const val = row[header] !== null ? row[header] : '';
      return `"${val}"`;
    });
    csv += values.join(',') + '\r\n';
  });
  
  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report_${new Date().toISOString().split('T')[0]}.csv"`);
  
  // Send CSV data
  res.send(csv);
}

export default router;
