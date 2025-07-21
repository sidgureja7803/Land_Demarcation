import { Request, Response } from 'express';
import { db } from '../db';
import { documents } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { getRelativeFilePath, getFileUrl } from '../middleware/fileUpload';

// Upload a new document
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      documentType,
      plotId,
      logId,
      isPublic = false
    } = req.body;

    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required' });
    }

    // Get relative file path for storage in DB
    const filePath = getRelativeFilePath(req.file.path);
    const fileUrl = getFileUrl(filePath, req);

    const newDocument = await db.insert(documents).values({
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      filePath: filePath,
      fileUrl: fileUrl,
      documentType: documentType,
      plotId: plotId ? parseInt(plotId) : null,
      logId: logId ? parseInt(logId) : null,
      uploadedById: userId,
      isPublic: isPublic === 'true' || isPublic === true,
    }).returning();

    return res.status(201).json({
      message: 'Document uploaded successfully',
      document: newDocument[0]
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ error: 'Failed to upload document' });
  }
};

// Upload multiple documents
export const uploadMultipleDocuments = async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      documentType,
      plotId,
      logId,
      isPublic = false
    } = req.body;

    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required' });
    }

    const uploadedFiles = req.files as Express.Multer.File[];
    const uploadPromises = uploadedFiles.map(file => {
      // Get relative file path for storage in DB
      const filePath = getRelativeFilePath(file.path);
      const fileUrl = getFileUrl(filePath, req);

      return db.insert(documents).values({
        filename: file.filename,
        originalFilename: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        filePath: filePath,
        fileUrl: fileUrl,
        documentType: documentType,
        plotId: plotId ? parseInt(plotId) : null,
        logId: logId ? parseInt(logId) : null,
        uploadedById: userId,
        isPublic: isPublic === 'true' || isPublic === true,
      });
    });

    await Promise.all(uploadPromises);

    return res.status(201).json({
      message: `${uploadedFiles.length} documents uploaded successfully`,
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    return res.status(500).json({ error: 'Failed to upload documents' });
  }
};

// Get documents by plot ID
export const getDocumentsByPlot = async (req: Request, res: Response) => {
  try {
    const { plotId } = req.params;
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let docs;
    
    // If user is a citizen, they can only view public documents or documents they uploaded
    if (userRole === 'citizen') {
      docs = await db.select()
        .from(documents)
        .where(
          and(
            eq(documents.plotId, parseInt(plotId)),
            // Either the document is public OR the user uploaded it
            or(
              eq(documents.isPublic, true),
              eq(documents.uploadedById, userId)
            )
          )
        );
    } else {
      // Officers and admins can see all documents
      docs = await db.select()
        .from(documents)
        .where(eq(documents.plotId, parseInt(plotId)));
    }

    return res.status(200).json(docs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// Get documents by log ID
export const getDocumentsByLog = async (req: Request, res: Response) => {
  try {
    const { logId } = req.params;
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let docs;
    
    // If user is a citizen, they can only view public documents or documents they uploaded
    if (userRole === 'citizen') {
      docs = await db.select()
        .from(documents)
        .where(
          and(
            eq(documents.logId, parseInt(logId)),
            // Either the document is public OR the user uploaded it
            or(
              eq(documents.isPublic, true),
              eq(documents.uploadedById, userId)
            )
          )
        );
    } else {
      // Officers and admins can see all documents
      docs = await db.select()
        .from(documents)
        .where(eq(documents.logId, parseInt(logId)));
    }

    return res.status(200).json(docs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// Get document by ID
export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const doc = await db.select()
      .from(documents)
      .where(eq(documents.id, parseInt(id)))
      .limit(1);

    if (doc.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if user has permission to view the document
    if (userRole === 'citizen' && !doc[0].isPublic && doc[0].uploadedById !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this document' });
    }

    return res.status(200).json(doc[0]);
  } catch (error) {
    console.error('Error fetching document:', error);
    return res.status(500).json({ error: 'Failed to fetch document' });
  }
};

// Verify a document (for officers/ADC)
export const verifyDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { verificationStatus, verificationNotes } = req.body;
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    
    if (!userId || (userRole !== 'officer' && userRole !== 'admin')) {
      return res.status(403).json({ error: 'Unauthorized. Only officers can verify documents' });
    }

    if (!verificationStatus || !['verified', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({ error: 'Invalid verification status' });
    }

    const updatedDoc = await db.update(documents)
      .set({
        verificationStatus: verificationStatus,
        verificationNotes: verificationNotes || null,
        verifiedById: userId,
        verifiedAt: new Date(),
      })
      .where(eq(documents.id, parseInt(id)))
      .returning();

    if (updatedDoc.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.status(200).json({
      message: 'Document verification updated',
      document: updatedDoc[0]
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    return res.status(500).json({ error: 'Failed to update document verification' });
  }
};

// Delete a document
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // First, get the document to check permissions and get the file path
    const doc = await db.select()
      .from(documents)
      .where(eq(documents.id, parseInt(id)))
      .limit(1);

    if (doc.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if user has permission to delete the document
    if (userRole === 'citizen' && doc[0].uploadedById !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this document' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', doc[0].filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await db.delete(documents)
      .where(eq(documents.id, parseInt(id)));

    return res.status(200).json({
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
};

// Serve a document file
export const serveDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const doc = await db.select()
      .from(documents)
      .where(eq(documents.id, parseInt(id)))
      .limit(1);

    if (doc.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if user has permission to view the document
    if (userRole === 'citizen' && !doc[0].isPublic && doc[0].uploadedById !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this document' });
    }

    const filePath = path.join(__dirname, '..', doc[0].filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Type', doc[0].mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc[0].originalFilename}"`);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving document:', error);
    return res.status(500).json({ error: 'Failed to serve document' });
  }
};
