import React, { useState, useRef, ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileUp, X, File, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface DocumentUploadProps {
  plotId?: number;
  logId?: number;
  onUploadComplete?: (document: any) => void;
  maxFiles?: number;
  allowMultiple?: boolean;
  userType?: 'citizen' | 'officer' | 'admin';
}

type FileWithPreview = {
  file: File;
  id: string;
  preview?: string;
  progress: number;
  error?: string;
  uploading: boolean;
  uploaded: boolean;
};

const DOCUMENT_TYPES = [
  { value: 'ownership_proof', label: 'Ownership Proof' },
  { value: 'id_proof', label: 'Identity Proof' },
  { value: 'survey_map', label: 'Survey Map' },
  { value: 'no_objection_certificate', label: 'No Objection Certificate' },
  { value: 'land_records', label: 'Land Records' },
  { value: 'official_notice', label: 'Official Notice' },
  { value: 'application_form', label: 'Application Form' },
  { value: 'other', label: 'Other Documents' },
];

export function DocumentUpload({
  plotId,
  logId,
  onUploadComplete,
  maxFiles = 5,
  allowMultiple = true,
  userType = 'citizen',
}: DocumentUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [documentType, setDocumentType] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Generate unique ID for each file
  const generateId = () => Math.random().toString(36).substring(2, 15);

  // Handle file selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    
    const selectedFiles = Array.from(e.target.files);
    
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Maximum files exceeded",
        description: `You can upload a maximum of ${maxFiles} files at once.`,
        variant: "destructive",
      });
      return;
    }
    
    // Process each file
    const newFiles = selectedFiles.map(file => {
      // Create preview for image files
      let preview = undefined;
      if (file.type.includes('image/')) {
        preview = URL.createObjectURL(file);
      }
      
      return {
        file,
        id: generateId(),
        preview,
        progress: 0,
        uploading: false,
        uploaded: false,
      };
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  // Remove a file from the list
  const removeFile = (id: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== id);
      // Revoke object URL for image previews to avoid memory leaks
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updatedFiles;
    });
  };

  // Handle document type selection
  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value);
  };

  // Handle public/private toggle
  const handlePublicToggle = (checked: boolean) => {
    setIsPublic(checked);
  };

  // Upload a single file
  const uploadFile = async (fileWithPreview: FileWithPreview) => {
    if (!documentType) {
      toast({
        title: "Document type required",
        description: "Please select a document type before uploading.",
        variant: "destructive",
      });
      return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('document', fileWithPreview.file);
    formData.append('documentType', documentType);
    formData.append('isPublic', isPublic.toString());
    
    if (plotId) {
      formData.append('plotId', plotId.toString());
    }
    
    if (logId) {
      formData.append('logId', logId.toString());
    }
    
    // Update file status
    setFiles(prev => 
      prev.map(f => f.id === fileWithPreview.id ? { ...f, uploading: true } : f)
    );
    
    try {
      // Simulate progress updates (in a real app, you might use axios with onUploadProgress)
      const progressInterval = setInterval(() => {
        setFiles(prev => 
          prev.map(f => 
            f.id === fileWithPreview.id ? 
              { ...f, progress: Math.min(f.progress + 10, 90) } : f
          )
        );
      }, 200);
      
      // Make API request
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }
      
      const data = await response.json();
      
      // Update file status
      setFiles(prev => 
        prev.map(f => 
          f.id === fileWithPreview.id ? 
            { ...f, uploading: false, uploaded: true, progress: 100 } : f
        )
      );
      
      // Invalidate queries to refetch document lists
      if (plotId) {
        queryClient.invalidateQueries({ queryKey: ['documents', 'plot', plotId] });
      }
      
      if (logId) {
        queryClient.invalidateQueries({ queryKey: ['documents', 'log', logId] });
      }
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(data.document);
      }
      
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      
      // Update file status with error
      setFiles(prev => 
        prev.map(f => 
          f.id === fileWithPreview.id ? 
            { ...f, uploading: false, error: error instanceof Error ? error.message : 'Upload failed', progress: 0 } : f
        )
      );
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: "destructive",
      });
      
      return null;
    }
  };

  // Upload all files
  const uploadAllFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    if (!documentType) {
      toast({
        title: "Document type required",
        description: "Please select a document type before uploading.",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    // Upload files one by one
    for (const file of files) {
      if (!file.uploaded && !file.uploading) {
        await uploadFile(file);
      }
    }
    
    setUploading(false);
    
    toast({
      title: "Upload complete",
      description: "All documents have been uploaded successfully.",
    });
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear all files
  const clearFiles = () => {
    // Revoke object URLs for image previews to avoid memory leaks
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    
    setFiles([]);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clean up object URLs on component unmount
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Document Upload</CardTitle>
        <CardDescription>
          Upload required documents for your land demarcation application
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="documentType">Document Type</Label>
          <Select value={documentType} onValueChange={handleDocumentTypeChange}>
            <SelectTrigger id="documentType">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Only show public/private toggle for officers and admins */}
        {userType !== 'citizen' && (
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={handlePublicToggle}
            />
            <Label htmlFor="isPublic">Make document publicly accessible to citizen</Label>
          </div>
        )}
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            id="fileUpload"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple={allowMultiple}
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          />
          
          <label htmlFor="fileUpload" className="cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-2">
              <FileUp size={40} className="text-gray-400" />
              <p className="text-sm font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, PDF, DOC, DOCX, XLS, XLSX, TXT, CSV (max {maxFiles} files, 10MB each)
              </p>
              <Button type="button" variant="secondary" size="sm">
                Browse Files
              </Button>
            </div>
          </label>
        </div>
        
        {/* File list */}
        {files.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Selected Files ({files.length}/{maxFiles})</h4>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center border rounded-md p-2">
                  {file.preview ? (
                    <img 
                      src={file.preview} 
                      alt={file.file.name} 
                      className="h-10 w-10 object-cover rounded-md mr-3" 
                    />
                  ) : (
                    <File className="h-10 w-10 p-2 rounded-md mr-3 bg-gray-100" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.file.size / 1024).toFixed(2)} KB
                    </p>
                    
                    {file.uploading && (
                      <Progress value={file.progress} className="h-1 mt-1" />
                    )}
                    
                    {file.error && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>
                  
                  <div className="ml-4 flex items-center">
                    {file.uploaded ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-red-500"
                        disabled={file.uploading}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={clearFiles} 
          disabled={files.length === 0 || uploading}
        >
          Clear All
        </Button>
        
        <Button
          type="button"
          onClick={uploadAllFiles}
          disabled={files.length === 0 || uploading || !documentType}
        >
          {uploading ? 'Uploading...' : 'Upload Documents'}
        </Button>
      </CardFooter>
    </Card>
  );
}
