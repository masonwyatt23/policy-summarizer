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
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Processing failed' }
            : f
        ));
        
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : 'Upload failed',
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
          ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
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
    <Card className="bg-card">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Upload className="w-5 h-5 text-valley-primary mr-2" />
          Upload Policy Document
        </h2>
        
        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-2 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-valley-primary bg-blue-50 dark:bg-blue-950/30' 
              : 'border-border hover:border-valley-primary'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 bg-valley-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-valley-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {isDragActive ? 'Drop files here' : 'Drop files here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground">
                PDF and DOCX files up to 10MB
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {uploadingFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            {uploadingFiles.map((fileData, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  fileData.status === 'success' ? 'bg-green-50 dark:bg-green-950/30' :
                  fileData.status === 'error' ? 'bg-red-50 dark:bg-red-950/30' :
                  'bg-blue-50 dark:bg-blue-950/30'
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
                  <p className="text-sm font-medium text-foreground truncate">
                    {fileData.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(fileData.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  {fileData.status === 'uploading' && (
                    <Progress value={fileData.progress} className="mt-2 h-2" />
                  )}
                  {fileData.status === 'processing' && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {fileData.processingStage || 'Processing document...'}
                    </p>
                  )}
                  {fileData.status === 'retrying' && (
                    <p className="text-xs text-blue-600 mt-1">
                      Retrying... (Attempt {fileData.retryCount || 1})
                    </p>
                  )}
                  {fileData.status === 'error' && fileData.error && (
                    <div className="mt-1">
                      <p className="text-xs text-red-600">{fileData.error}</p>
                      {(fileData.retryCount || 0) < 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryUpload(fileData.file)}
                          className="mt-1 h-6 px-2 text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileData.file)}
                    className="text-muted-foreground hover:text-foreground"
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
