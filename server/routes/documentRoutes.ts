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
} from '../controllers/shared/documentController';
import { uploadSingleFile, uploadMultipleFiles } from '../middleware/fileUpload';
import { isAuthenticated, hasRole } from '../middleware/shared/authMiddleware';

const router = express.Router();

// Authentication middleware for all document routes
router.use(isAuthenticated);

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

// Get all documents (admins only)
router.get('/admin/all', hasRole('admin'), async (req, res) => {
  try {
    // This would call a controller function if it existed
    res.status(501).json({ message: 'Get all documents endpoint not yet implemented' });
  } catch (error) {
    console.error('Error getting all documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Verify document (officers and admins only)
router.patch(
  '/:id/verify',
  hasRole('officer'), // Changed to accept a single role instead of array
  verifyDocument
);

// Delete document
router.delete('/:id', deleteDocument);

export default router;
