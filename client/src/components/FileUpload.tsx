import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Loader2, 
  Clock 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface FileUploadProps {
  onUploadSuccess: (documentId: number) => void;
  summaryLength?: 'short'; // Always brief summaries
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

export function FileUpload({ onUploadSuccess, summaryLength = 'short' }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleUpload = async (fileData: UploadingFile) => {
    const progressInterval = setInterval(() => {
      setUploadingFiles(prev => prev.map(f => 
        f.file === fileData.file && f.status === 'uploading' && f.progress < 90
          ? { ...f, progress: f.progress + 10 }
          : f
      ));
    }, 200);

    try {
      console.log('Uploading with summaryLength:', summaryLength);
      
      const result = await api.uploadDocument(fileData.file, { summaryLength });
      
      clearInterval(progressInterval);
      
      setUploadingFiles(prev => prev.map(f => 
        f.file === fileData.file 
          ? { ...f, progress: 100, status: 'processing', documentId: result.documentId, processingStage: 'Initializing AI analysis...' }
          : f
      ));
      
      if (result.documentId) {
        await pollProcessingStatus(result.documentId, fileData.file);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      const retryCount = (fileData.retryCount || 0) + 1;
      
      if (retryCount < 3) {
        setUploadingFiles(prev => prev.map(f => 
          f.file === fileData.file 
            ? { ...f, status: 'retrying', retryCount }
            : f
        ));
        
        setTimeout(() => {
          handleUpload({ ...fileData, retryCount });
        }, 2000);
      } else {
        setUploadingFiles(prev => prev.map(f => 
          f.file === fileData.file 
            ? { ...f, status: 'error', error: error.message }
            : f
        ));
        
        toast({
          title: 'Upload Failed',
          description: error.message || 'Failed to upload document',
          variant: 'destructive'
        });
      }
    }
  };

  const retryUpload = async (file: File) => {
    const existingFile = uploadingFiles.find(f => f.file === file);
    if (!existingFile) return;
    
    setUploadingFiles(prev => prev.map(f => 
      f.file === file 
        ? { ...f, status: 'uploading', progress: 0, error: undefined, retryCount: (f.retryCount || 0) + 1 }
        : f
    ));
    
    await handleUpload({ ...existingFile, status: 'uploading', progress: 0, error: undefined });
  };

  const pollProcessingStatus = async (documentId: number, file: File) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;
    const processingStages = [
      'Reading document content...',
      'Extracting policy information...',
      'Analyzing coverage details...',
      'Identifying key benefits...',
      'Creating professional summary...',
      'Adding bullet points...',
      'Finalizing client-ready document...'
    ];

    const pollInterval = setInterval(async () => {
      try {
        attempts++;
        const status = await api.getDocumentStatus(documentId);
        
        // Update processing stage for better user feedback
        const stageIndex = Math.min(Math.floor(attempts / 2), processingStages.length - 1);
        setUploadingFiles(prev => prev.map(f => 
          f.file === file 
            ? { ...f, processingStage: processingStages[stageIndex] }
            : f
        ));
        
        if (status.processed && status.hasSummary) {
          clearInterval(pollInterval);
          setUploadingFiles(prev => prev.map(f => 
            f.file === file 
              ? { ...f, status: 'success', documentId }
              : f
          ));
          
          onUploadSuccess(documentId);
          
          // Invalidate queries to refresh document list
          queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
          
          toast({
            title: 'Success',
            description: 'Document processed successfully!',
          });
        } else if (status.processingError || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          const errorMessage = status.processingError || (attempts >= maxAttempts ? 'Processing timeout' : 'Processing failed');
          
          setUploadingFiles(prev => prev.map(f => 
            f.file === file 
              ? { ...f, status: 'error', error: errorMessage }
              : f
          ));
          
          toast({
            title: 'Processing Failed',
            description: errorMessage,
            variant: 'destructive'
          });
        }
      } catch (error) {
        clearInterval(pollInterval);
        setUploadingFiles(prev => prev.map(f => 
          f.file === file 
            ? { ...f, status: 'error', error: 'Failed to check processing status' }
            : f
        ));
      }
    }, 10000); // Check every 10 seconds instead of 5
  };

  const removeFile = (fileToRemove: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));
    
    setUploadingFiles(prev => [...prev, ...newFiles]);
    
    newFiles.forEach(fileData => {
      handleUpload(fileData);
    });
  }, [summaryLength]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Upload Insurance Policy</CardTitle>
        <CardDescription className="text-base">
          Upload a PDF or DOCX file to analyze and generate a summary
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-valley-primary bg-valley-primary/5' 
              : 'border-border hover:border-valley-primary'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 bg-valley-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-valley-primary" />
            </div>
            <div className="flex-1">
              <p className="text-base font-medium text-foreground">
                {isDragActive ? 'Drop files here' : 'Drop files here or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground">
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
                className={`rounded-lg ${
                  fileData.status === 'success' ? 'bg-green-50 dark:bg-green-950/30' :
                  fileData.status === 'error' ? 'bg-red-50 dark:bg-red-950/30' :
                  'bg-blue-50 dark:bg-blue-950/30'
                } ${fileData.status === 'processing' ? 'p-1' : 'p-3'}`}
              >
                {fileData.status === 'processing' ? (
                  <div className="mt-4 mb-2">
                    <div className="flex flex-col items-center justify-center space-y-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
                        <p className="text-lg text-blue-600 font-semibold">
                          {fileData.processingStage || 'Processing document...'}
                        </p>
                      </div>
                      
                      <div className="w-full max-w-md">
                        <div className="flex justify-between items-center">
                          {[...Array(7)].map((_, i) => {
                            const currentStage = fileData.processingStage || '';
                            const stages = [
                              'Reading document content...',
                              'Extracting policy information...',
                              'Analyzing coverage details...',
                              'Identifying key benefits...',
                              'Creating professional summary...',
                              'Adding bullet points...',
                              'Finalizing client-ready document...'
                            ];
                            const stageLabels = ['Read', 'Extract', 'Analyze', 'Benefits', 'Summary', 'Bullets', 'Finalize'];
                            const stageIndex = stages.findIndex(stage => stage === currentStage);
                            const isActive = i <= stageIndex;
                            const isCurrentStep = i === stageIndex;
                            const isCompleted = i < stageIndex;
                            
                            return (
                              <div key={i} className="flex flex-col items-center">
                                <div className="relative">
                                  <div 
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-500 ${
                                      isActive
                                        ? 'bg-blue-600 text-white scale-110 shadow-lg' 
                                        : 'bg-gray-200 text-gray-500'
                                    }`}
                                  >
                                    {isCurrentStep ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : isCompleted ? (
                                      '✓'
                                    ) : (
                                      i + 1
                                    )}
                                  </div>
                                  {isCurrentStep && (
                                    <div className="absolute inset-0 rounded-full bg-blue-600 opacity-20 animate-ping" />
                                  )}
                                  {i < 6 && (
                                    <div 
                                      className={`absolute top-5 left-10 h-0.5 transition-all duration-500 ${
                                        i < stageIndex ? 'bg-blue-600' : 
                                        i === stageIndex ? 'bg-gray-300 animate-pulse' :
                                        'bg-gray-300'
                                      }`}
                                      style={{ width: '40px' }}
                                    />
                                  )}
                                </div>
                                <span className={`text-xs mt-1 transition-all duration-300 ${
                                  isCurrentStep ? 'text-blue-700 font-semibold' : 
                                  isActive ? 'text-blue-600 font-medium' : 
                                  'text-gray-400'
                                }`}>
                                  {stageLabels[i]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground text-center">
                        Please wait while we analyze your document...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
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
                      <p className="text-base font-medium text-foreground truncate">
                        {fileData.file.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(fileData.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      {fileData.status === 'uploading' && (
                        <Progress value={fileData.progress} className="mt-2 h-2" />
                      )}
                      {fileData.status === 'retrying' && (
                        <p className="text-sm text-blue-600 mt-1">
                          Retrying... (Attempt {fileData.retryCount || 1})
                        </p>
                      )}
                      {fileData.status === 'error' && fileData.error && (
                        <div className="mt-1">
                          <p className="text-sm text-red-600">{fileData.error}</p>
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
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}