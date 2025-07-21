import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads');
const plotDocsDir = path.join(uploadDir, 'plots');
const logDocsDir = path.join(uploadDir, 'logs');

// Create directories if they don't exist
[uploadDir, plotDocsDir, logDocsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Define storage configuration for multer
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    // Determine appropriate directory based on document type
    const isLogDocument = req.path.includes('/logs') || req.body.logId;
    const targetDir = isLogDocument ? logDocsDir : plotDocsDir;
    cb(null, targetDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    // Generate unique filename with UUID to prevent collisions
    // Format: uuid-originalname
    const uniqueFilename = `${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, uniqueFilename);
  }
});

// File filter to restrict file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only specific file types for document uploads
  const allowedFileTypes = [
    // Images
    'image/jpeg', 
    'image/png', 
    'image/jpg',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'text/plain',
    'text/csv'
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: JPG, PNG, PDF, DOC, DOCX, XLS, XLSX, TXT, CSV'));
  }
};

// Configure size limits for different document types
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB default
};

// Export the multer instance for single file uploads
export const uploadSingleFile = multer({ 
  storage, 
  fileFilter,
  limits
});

// Export the multer instance for multiple file uploads
export const uploadMultipleFiles = multer({ 
  storage, 
  fileFilter,
  limits
});

// Helper function to get relative file path for storage in database
export const getRelativeFilePath = (absolutePath: string): string => {
  return absolutePath.replace(path.join(__dirname, '..'), '');
};

// Helper function to get full URL for a file (when running in specific environment)
export const getFileUrl = (relativePath: string, req: Request): string => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}${relativePath}`;
};
