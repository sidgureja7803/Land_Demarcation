import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  FileImage, 
  FilePdf, 
  FileArchive, 
  File, 
  Download, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Document {
  id: number;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  fileUrl: string;
  documentType: string;
  plotId?: number;
  logId?: number;
  uploadedById: string;
  verifiedById?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
  verifiedAt?: string;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DocumentListProps {
  plotId?: number;
  logId?: number;
  userType?: 'citizen' | 'officer' | 'admin';
  showUploadButton?: boolean;
  onUploadClick?: () => void;
}

// Helper function to get appropriate icon based on file type
const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('image')) {
    return <FileImage className="h-6 w-6" />;
  } else if (mimeType.includes('pdf')) {
    return <FilePdf className="h-6 w-6" />;
  } else if (mimeType.includes('word') || mimeType.includes('text')) {
    return <FileText className="h-6 w-6" />;
  } else if (mimeType.includes('zip') || mimeType.includes('compressed')) {
    return <FileArchive className="h-6 w-6" />;
  } else {
    return <File className="h-6 w-6" />;
  }
};

// Helper function to format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
};

// Map document types to human-readable labels
const DOCUMENT_TYPES: Record<string, string> = {
  'ownership_proof': 'Ownership Proof',
  'id_proof': 'Identity Proof',
  'survey_map': 'Survey Map',
  'no_objection_certificate': 'No Objection Certificate',
  'land_records': 'Land Records',
  'official_notice': 'Official Notice',
  'application_form': 'Application Form',
  'other': 'Other Document'
};

export function DocumentList({
  plotId,
  logId,
  userType = 'citizen',
  showUploadButton = true,
  onUploadClick
}: DocumentListProps) {
  const [selectedDocument, setSelectedDocument] = React.useState<Document | null>(null);
  const [verificationDialog, setVerificationDialog] = React.useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = React.useState<'verified' | 'rejected'>('verified');
  const [verificationNotes, setVerificationNotes] = React.useState<string>('');
  const queryClient = useQueryClient();
  
  // Query key based on document source (plot or log)
  const queryKey = plotId 
    ? ['documents', 'plot', plotId] 
    : logId 
      ? ['documents', 'log', logId]
      : null;
  
  // Fetch documents
  const { data: documents, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!queryKey) return [];
      
      const endpoint = plotId 
        ? `/api/documents/plot/${plotId}`
        : `/api/documents/log/${logId}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      return response.json() as Promise<Document[]>;
    },
    enabled: !!queryKey,
  });
  
  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully",
      });
      
      // Refetch documents
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : 'Failed to delete document',
        variant: "destructive",
      });
    },
  });
  
  // Verify document mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ documentId, status, notes }: { documentId: number; status: string; notes: string }) => {
      const response = await fetch(`/api/documents/${documentId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationStatus: status,
          verificationNotes: notes,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document verification updated",
        description: `Document has been ${verificationStatus === 'verified' ? 'verified' : 'rejected'}`,
      });
      
      // Close dialog and reset form
      setVerificationDialog(false);
      setVerificationStatus('verified');
      setVerificationNotes('');
      
      // Refetch documents
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
    onError: (error) => {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : 'Failed to update verification status',
        variant: "destructive",
      });
    },
  });

  // Handle document delete
  const handleDeleteDocument = (documentId: number) => {
    deleteMutation.mutate(documentId);
  };
  
  // Handle document verification
  const handleVerifyDocument = () => {
    if (!selectedDocument) return;
    
    verifyMutation.mutate({
      documentId: selectedDocument.id,
      status: verificationStatus,
      notes: verificationNotes,
    });
  };
  
  // Handle view document
  const handleViewDocument = (document: Document) => {
    window.open(`/api/documents/file/${document.id}`, '_blank');
  };
  
  // Handle download document
  const handleDownloadDocument = (document: Document) => {
    // Create a link and simulate click
    const link = document.createElement('a');
    link.href = `/api/documents/file/${document.id}`;
    link.download = document.originalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Open verification dialog
  const openVerificationDialog = (document: Document) => {
    setSelectedDocument(document);
    setVerificationDialog(true);
  };

  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Error loading documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <AlertCircle className="h-8 w-8 text-red-500 mr-2" />
            <p>
              {error instanceof Error ? error.message : 'Failed to fetch documents'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {plotId && 'Documents related to this plot'}
            {logId && 'Documents related to this demarcation log'}
          </CardDescription>
        </div>
        
        {showUploadButton && (
          <Button onClick={onUploadClick} size="sm">
            Upload Documents
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : documents && documents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-100 p-2 rounded-md">
                        {getFileIcon(doc.mimeType)}
                      </div>
                      <div>
                        <p className="font-medium truncate max-w-[200px]">
                          {doc.originalFilename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {DOCUMENT_TYPES[doc.documentType] || doc.documentType}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={doc.verificationStatus === 'verified' 
                        ? 'success' 
                        : doc.verificationStatus === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {doc.verificationStatus === 'verified' && (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {doc.verificationStatus === 'rejected' && (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      {doc.verificationStatus.charAt(0).toUpperCase() + doc.verificationStatus.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(doc.createdAt), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {/* Only officers can verify documents */}
                      {(userType === 'officer' || userType === 'admin') && doc.verificationStatus === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-500"
                          onClick={() => openVerificationDialog(doc)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Only document owner or officers can delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this document? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-6">
            <File className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-1">No documents found</h3>
            <p className="text-gray-500">
              {userType === 'citizen'
                ? "You haven't uploaded any documents yet."
                : "No documents have been uploaded for this item yet."
              }
            </p>
          </div>
        )}
      </CardContent>
      
      {/* Verification Dialog */}
      <Dialog open={verificationDialog} onOpenChange={setVerificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Document</DialogTitle>
            <DialogDescription>
              Review and update the verification status for this document.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 p-2 rounded-md">
                {selectedDocument && getFileIcon(selectedDocument.mimeType)}
              </div>
              <div>
                <p className="font-medium">
                  {selectedDocument?.originalFilename}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedDocument && formatFileSize(selectedDocument.fileSize)}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verificationStatus">Verification Status</Label>
              <Select 
                value={verificationStatus}
                onValueChange={(value: 'verified' | 'rejected') => setVerificationStatus(value)}
              >
                <SelectTrigger id="verificationStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verificationNotes">Notes</Label>
              <Textarea
                id="verificationNotes"
                placeholder="Add verification notes or reason for rejection..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyDocument}
              className={verificationStatus === 'verified' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {verificationStatus === 'verified' ? 'Verify Document' : 'Reject Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
