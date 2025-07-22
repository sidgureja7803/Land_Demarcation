const db = require('../models/db');
const { format } = require('date-fns');
const { parseISO } = require('date-fns');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const path = require('path');

// Get admin dashboard statistics
exports.getStats = async (req, res) => {
  try {
    // Get total plots count
    const totalPlotsResult = await db.query(
      'SELECT COUNT(*) as count FROM plots'
    );
    const totalPlots = totalPlotsResult.rows[0].count;
    
    // Get completed plots count
    const completedPlotsResult = await db.query(
      "SELECT COUNT(*) as count FROM plots WHERE status = 'completed'"
    );
    const completedPlots = completedPlotsResult.rows[0].count;
    
    // Get pending plots count
    const pendingPlotsResult = await db.query(
      "SELECT COUNT(*) as count FROM plots WHERE status IN ('pending', 'in_progress')"
    );
    const pendingPlots = pendingPlotsResult.rows[0].count;
    
    // Get active officers count
    const activeOfficersResult = await db.query(
      "SELECT COUNT(DISTINCT user_id) as count FROM assignments WHERE status = 'active'"
    );
    const activeOfficers = activeOfficersResult.rows[0].count;
    
    // Get total villages count
    const totalVillagesResult = await db.query(
      'SELECT COUNT(DISTINCT village_name) as count FROM plots'
    );
    const totalVillages = totalVillagesResult.rows[0].count;
    
    // Get duplicate plots count (plots with same khasra number in same village)
    const duplicatesResult = await db.query(`
      SELECT COUNT(*) as count FROM (
        SELECT khasra_number, village_name, COUNT(*) as entries
        FROM plots
        GROUP BY khasra_number, village_name
        HAVING COUNT(*) > 1
      ) as duplicates
    `);
    const duplicates = duplicatesResult.rows[0].count;
    
    // Get average resolution time in days
    const avgTimeResult = await db.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400) as avg_days
      FROM demarcation_logs
      WHERE status = 'completed'
    `);
    const avgDays = avgTimeResult.rows[0].avg_days || 0;
    const averageResolutionTime = `${Math.round(avgDays)} days`;
    
    // Calculate completion rate
    const completionRate = totalPlots > 0 
      ? `${Math.round((completedPlots / totalPlots) * 100)}%` 
      : '0%';
    
    res.json({
      totalPlots: parseInt(totalPlots),
      completedPlots: parseInt(completedPlots),
      pendingPlots: parseInt(pendingPlots),
      activeOfficers: parseInt(activeOfficers),
      totalVillages: parseInt(totalVillages),
      duplicates: parseInt(duplicates),
      averageResolutionTime,
      completionRate
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin dashboard statistics' });
  }
};

// Get plot status distribution for charts
exports.getStatusDistribution = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT status as name, COUNT(*) as count
      FROM plots
      GROUP BY status
      ORDER BY count DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    res.status(500).json({ error: 'Failed to fetch status distribution data' });
  }
};

// Get circle-wise plot distribution for charts
exports.getCircleDistribution = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT circle_name as name, COUNT(*) as count
      FROM plots
      GROUP BY circle_name
      ORDER BY count DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching circle distribution:', error);
    res.status(500).json({ error: 'Failed to fetch circle distribution data' });
  }
};

// Get village-wise plot distribution for charts
exports.getVillageDistribution = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT village_name as name, COUNT(*) as count
      FROM plots
      GROUP BY village_name
      ORDER BY count DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching village distribution:', error);
    res.status(500).json({ error: 'Failed to fetch village distribution data' });
  }
};

// Get officer performance data
exports.getOfficerPerformance = async (req, res) => {
  try {
    const result = await db.query(`
      WITH officer_stats AS (
        SELECT 
          u.id,
          u.name,
          p.circle_name as circle,
          COUNT(CASE WHEN dl.status = 'completed' THEN 1 END) as completed_plots,
          COUNT(CASE WHEN dl.status IN ('pending', 'in_progress') THEN 1 END) as pending_plots,
          AVG(CASE WHEN dl.status = 'completed' THEN 
            EXTRACT(EPOCH FROM (dl.completed_at - dl.created_at)) / 86400
          END) as avg_time_days,
          MAX(dl.updated_at) as last_activity
        FROM users u
        JOIN assignments a ON u.id = a.user_id
        JOIN plots p ON a.plot_id = p.id
        LEFT JOIN demarcation_logs dl ON p.id = dl.plot_id AND u.id = dl.officer_id
        WHERE u.role = 'officer'
        GROUP BY u.id, u.name, p.circle_name
      )
      SELECT 
        id,
        name,
        circle,
        completed_plots,
        pending_plots,
        CASE 
          WHEN (completed_plots + pending_plots) > 0 THEN 
            ROUND((completed_plots::numeric / (completed_plots + pending_plots)) * 100)
          ELSE 0
        END as efficiency,
        CASE
          WHEN avg_time_days IS NOT NULL THEN ROUND(avg_time_days) || ' days'
          ELSE 'N/A'
        END as avg_time_per_plot,
        TO_CHAR(last_activity, 'DD-MM-YYYY') as last_activity
      FROM officer_stats
      ORDER BY efficiency DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching officer performance:', error);
    res.status(500).json({ error: 'Failed to fetch officer performance data' });
  }
};

// Generate and download reports
exports.generateReport = async (req, res) => {
  try {
    const { type, format } = req.query;
    const fromDate = req.query.fromDate ? parseISO(req.query.fromDate) : null;
    const toDate = req.query.toDate ? parseISO(req.query.toDate) : null;
    
    // Get report data based on type
    let reportData;
    let reportTitle;
    let dateFilter = '';
    
    if (fromDate && toDate) {
      dateFilter = `AND created_at BETWEEN '${format(fromDate, 'yyyy-MM-dd')}' AND '${format(toDate, 'yyyy-MM-dd')}'`;
    }
    
    switch (type) {
      case 'plotStatus':
        reportTitle = 'Plot Status Report';
        reportData = await db.query(`
          SELECT 
            p.khasra_number, 
            p.village_name,
            p.circle_name,
            p.owner_name,
            p.area,
            p.status,
            p.priority,
            TO_CHAR(p.created_at, 'DD-MM-YYYY') as created_date
          FROM plots p
          WHERE 1=1 ${dateFilter}
          ORDER BY p.created_at DESC
        `);
        break;
        
      case 'officerPerformance':
        reportTitle = 'Officer Performance Report';
        reportData = await db.query(`
          WITH officer_stats AS (
            SELECT 
              u.id,
              u.name,
              p.circle_name as circle,
              COUNT(CASE WHEN dl.status = 'completed' THEN 1 END) as completed_plots,
              COUNT(CASE WHEN dl.status IN ('pending', 'in_progress') THEN 1 END) as pending_plots,
              AVG(CASE WHEN dl.status = 'completed' THEN 
                EXTRACT(EPOCH FROM (dl.completed_at - dl.created_at)) / 86400
              END) as avg_time_days,
              MAX(dl.updated_at) as last_activity
            FROM users u
            JOIN assignments a ON u.id = a.user_id
            JOIN plots p ON a.plot_id = p.id
            LEFT JOIN demarcation_logs dl ON p.id = dl.plot_id AND u.id = dl.officer_id
            WHERE u.role = 'officer' ${dateFilter ? 'AND ' + dateFilter.substring(4) : ''}
            GROUP BY u.id, u.name, p.circle_name
          )
          SELECT 
            name,
            circle,
            completed_plots,
            pending_plots,
            CASE 
              WHEN (completed_plots + pending_plots) > 0 THEN 
                ROUND((completed_plots::numeric / (completed_plots + pending_plots)) * 100)
              ELSE 0
            END as efficiency,
            CASE
              WHEN avg_time_days IS NOT NULL THEN ROUND(avg_time_days) || ' days'
              ELSE 'N/A'
            END as avg_time_per_plot,
            TO_CHAR(last_activity, 'DD-MM-YYYY') as last_activity
          FROM officer_stats
          ORDER BY efficiency DESC
        `);
        break;
        
      case 'villageStats':
        reportTitle = 'Village-wise Statistics Report';
        reportData = await db.query(`
          SELECT 
            village_name,
            COUNT(*) as total_plots,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_plots,
            COUNT(CASE WHEN status IN ('pending', 'in_progress') THEN 1 END) as pending_plots,
            ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400)) as avg_resolution_days
          FROM plots
          WHERE 1=1 ${dateFilter}
          GROUP BY village_name
          ORDER BY total_plots DESC
        `);
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }
    
    // Generate report file based on format
    switch (format.toLowerCase()) {
      case 'csv':
        return generateCSV(res, reportData.rows, reportTitle);
        
      case 'excel':
        return await generateExcel(res, reportData.rows, reportTitle);
        
      case 'pdf':
        return await generatePDF(res, reportData.rows, reportTitle);
        
      default:
        return res.status(400).json({ error: 'Invalid format type' });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Helper function to generate CSV report
function generateCSV(res, data, reportTitle) {
  if (data.length === 0) {
    return res.status(404).json({ error: 'No data available for report' });
  }
  
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
  res.setHeader('Content-Disposition', `attachment; filename="${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv"`);
  
  // Send CSV data
  res.send(csv);
}

// Helper function to generate Excel report
async function generateExcel(res, data, reportTitle) {
  if (data.length === 0) {
    return res.status(404).json({ error: 'No data available for report' });
  }
  
  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportTitle);
  
  // Set headers
  const headers = Object.keys(data[0]);
  worksheet.addRow(headers);
  
  // Add data
  data.forEach(row => {
    const values = headers.map(header => row[header]);
    worksheet.addRow(values);
  });
  
  // Format headers
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });
  
  // Set column widths
  headers.forEach((header, i) => {
    worksheet.getColumn(i + 1).width = 20;
  });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx"`);
  
  // Write to buffer and send
  const buffer = await workbook.xlsx.writeBuffer();
  res.send(buffer);
}

// Helper function to generate PDF report
async function generatePDF(res, data, reportTitle) {
  if (data.length === 0) {
    return res.status(404).json({ error: 'No data available for report' });
  }

  // Create PDF document
  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf"`);
  
  // Pipe PDF to response
  doc.pipe(res);
  
  // Add report title
  doc.fontSize(16).font('Helvetica-Bold').text(reportTitle, { align: 'center' });
  doc.moveDown();
  
  // Add generation date
  doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown();
  
  // Create table
  const headers = Object.keys(data[0]);
  
  // Format data for table
  const tableData = {
    headers: headers,
    rows: data.map(row => headers.map(header => row[header]))
  };
  
  // Draw table
  doc.table(tableData, { 
    prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
    prepareRow: () => doc.font('Helvetica').fontSize(8)
  });
  
  // Finalize PDF
  doc.end();
}
