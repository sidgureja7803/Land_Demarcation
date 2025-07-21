import express from 'express';
import { 
  uploadDocument,
  uploadMultipleDocuments,
  getDocumentsByPlot,
  getDocumentsByLog,
  getDocumentById,
  verifyDocument,
  deleteDocument,
  serveDocument
} from '../controllers/documentController';
import { uploadSingleFile, uploadMultipleFiles } from '../middleware/fileUpload';
import { authenticateUser, checkRole } from '../middleware/auth';

const router = express.Router();

// Authentication middleware for all document routes
router.use(authenticateUser);

// Single file upload
router.post(
  '/upload', 
  uploadSingleFile.single('document'),
  uploadDocument
);

// Multiple files upload
router.post(
  '/upload/multiple',
  uploadMultipleFiles.array('documents', 10), // Maximum 10 files at once
  uploadMultipleDocuments
);

// Get documents by plot ID
router.get('/plot/:plotId', getDocumentsByPlot);

// Get documents by log ID
router.get('/log/:logId', getDocumentsByLog);

// Get document by ID
router.get('/:id', getDocumentById);

// Serve document file
router.get('/file/:id', serveDocument);

// Verify document (officers and admins only)
router.patch(
  '/:id/verify',
  checkRole(['officer', 'admin']),
  verifyDocument
);

// Delete document
router.delete('/:id', deleteDocument);

export default router;
