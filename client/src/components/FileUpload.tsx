import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, RefreshCw, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onUploadSuccess: (documentId: number) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'success' | 'error' | 'retrying';
  error?: string;
  documentId?: number;
  retryCount?: number;
  processingStage?: string;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles(prev => [...prev, ...newFiles]);

    for (let i = 0; i < newFiles.length; i++) {
      const fileData = newFiles[i];
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => prev.map(f => 
            f.file === fileData.file && f.progress < 90 
              ? { ...f, progress: f.progress + 10 }
              : f
          ));
        }, 200);

        const result = await api.uploadDocument(fileData.file);
        
        clearInterval(progressInterval);
        
        setUploadingFiles(prev => prev.map(f => 
          f.file === fileData.file 
            ? { ...f, progress: 100, status: 'processing', documentId: result.documentId }
            : f
        ));

        // Poll for processing completion
        pollProcessingStatus(result.documentId, fileData.file);
        
      } catch (error) {
        setUploadingFiles(prev => prev.map(f => 
          f.file === fileData.file 
            ? { ...f, status: 'error', error: error.message }
            : f
        ));
        
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const retryUpload = async (file: File) => {
    setUploadingFiles(prev => prev.map(f => 
      f.file === file 
        ? { ...f, status: 'retrying', retryCount: (f.retryCount || 0) + 1, error: undefined }
        : f
    ));

    try {
      const result = await api.uploadDocument(file);
      
      setUploadingFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, status: 'processing', documentId: result.documentId, processingStage: 'Extracting text...' }
          : f
      ));

      pollProcessingStatus(result.documentId, file);
    } catch (error) {
      setUploadingFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
    }
  };

  const pollProcessingStatus = async (documentId: number, file: File) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;
    const processingStages = [
      'Extracting text...',
      'Analyzing document structure...',
      'Identifying key information...',
      'Generating client summary...',
      'Finalizing analysis...'
    ];

    const pollInterval = setInterval(async () => {
      try {
        attempts++;
        const status = await api.getDocumentStatus(documentId);
        
        // Update processing stage for better user feedback
        const stageIndex = Math.min(Math.floor(attempts / 3), processingStages.length - 1);
        setUploadingFiles(prev => prev.map(f => 
          f.file === file && f.status === 'processing'
            ? { ...f, processingStage: processingStages[stageIndex] }
            : f
        ));
        
        if (status.processed) {
          clearInterval(pollInterval);
          
          if (status.processingError) {
            setUploadingFiles(prev => prev.map(f => 
              f.file === file 
                ? { ...f, status: 'error', error: status.processingError }
                : f
            ));
            
            toast({
              title: "Processing failed",
              description: status.processingError,
              variant: "destructive",
            });
          } else {
            setUploadingFiles(prev => prev.map(f => 
              f.file === file 
                ? { ...f, status: 'success', processingStage: 'Complete!' }
                : f
            ));
            
            toast({
              title: "Document processed successfully",
              description: `${status.originalName} has been analyzed and is ready for review.`,
            });
            
            onUploadSuccess(documentId);
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setUploadingFiles(prev => prev.map(f => 
            f.file === file 
              ? { ...f, status: 'error', error: 'Processing timeout - document may be too complex' }
              : f
          ));
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (attempts > 3) {
          clearInterval(pollInterval);
          setUploadingFiles(prev => prev.map(f => 
            f.file === file 
              ? { ...f, status: 'error', error: 'Connection error during processing' }
              : f
          ));
        }
      }
    }, 5000);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (fileToRemove: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Upload className="w-5 h-5 text-valley-primary mr-2" />
          Upload Policy Document
        </h2>
        
        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-valley-primary bg-blue-50' 
              : 'border-slate-300 hover:border-valley-primary'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-valley-primary/10 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-valley-primary" />
            </div>
            <div>
              <p className="text-base font-medium text-slate-900">
                {isDragActive ? 'Drop files here' : 'Drop files here or click to browse'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Supports PDF and DOCX files up to 10MB
              </p>
            </div>
            <Button variant="outline" size="sm" className="valley-primary-hover">
              Choose Files
            </Button>
          </div>
        </div>

        {/* File List */}
        {uploadingFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            {uploadingFiles.map((fileData, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  fileData.status === 'success' ? 'bg-green-50' :
                  fileData.status === 'error' ? 'bg-red-50' :
                  'bg-blue-50'
                }`}
              >
                <div className="flex-shrink-0">
                  {fileData.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : fileData.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : fileData.status === 'retrying' ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {fileData.file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(fileData.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  {fileData.status === 'uploading' && (
                    <Progress value={fileData.progress} className="mt-2 h-2" />
                  )}
                  {fileData.status === 'processing' && (
                    <p className="text-xs text-valley-primary mt-1">Processing document...</p>
                  )}
                  {fileData.status === 'error' && fileData.error && (
                    <p className="text-xs text-red-600 mt-1">{fileData.error}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileData.file)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
