import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { SimpleProcessingOptions } from '@/components/SimpleProcessingOptions';
import { CleanSummaryPreview } from '@/components/CleanSummaryPreview';
import { ExtractedData } from '@/components/ExtractedData';
import { ExportOptions } from '@/components/ExportOptions';
import { SummaryHistoryDialog } from '@/components/SummaryHistoryDialog';
import { Clock, FileText, CheckCircle, User } from 'lucide-react';
import { api, ProcessedDocument, DocumentListItem } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import logoPath from '@assets/Valley-Trust-Insurance-Logo_1751344889285.png';

interface PolicySummaryGeneratorProps {
  documentId?: string;
}

export default function PolicySummaryGenerator({ documentId }: PolicySummaryGeneratorProps = {}) {
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(
    documentId ? parseInt(documentId, 10) : null
  );
  const [processingConfig, setProcessingConfig] = useState<any>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const { toast } = useToast();

  // Update currentDocumentId when documentId prop changes
  useEffect(() => {
    if (documentId) {
      setCurrentDocumentId(parseInt(documentId, 10));
    }
  }, [documentId]);

  const { data: document, isLoading, refetch } = useQuery<ProcessedDocument>({
    queryKey: [`/api/documents/${currentDocumentId}`],
    enabled: !!currentDocumentId,
    refetchInterval: (data) => {
      // Keep polling if document is still being processed
      return data?.processed === false ? 5000 : false;
    },
  });

  const { data: documentsList } = useQuery<DocumentListItem[]>({
    queryKey: ['/api/documents'],
  });

  // PDF Export mutation
  const exportPDFMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const options = {
        clientName: '',
        policyReference: '',
        includeExplanations: true,
        includeTechnicalDetails: false,
        includeBranding: true,
      };
      
      const blob = await api.exportPDF(documentId, options);
      
      // Download the PDF
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = `policy-summary-${window.location.hostname}-${Date.now()}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(link);
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "PDF has been downloaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export PDF",
        variant: "destructive",
      });
    },
  });

  const handleUploadSuccess = (documentId: number) => {
    setCurrentDocumentId(documentId);
  };

  const handleExportPDF = () => {
    if (currentDocumentId) {
      exportPDFMutation.mutate(currentDocumentId);
    }
  };

  const isDocumentReady = document?.processed && !document?.processingError && document?.extractedData;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src={logoPath} alt="Valley Trust Insurance" className="h-10 w-auto" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-foreground">Policy Summary Generator</h1>
                <p className="text-sm text-muted-foreground">Internal Agent Tool</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="w-5 h-5" />
                <span>Agent Portal</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload and Processing Options Section - Top */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>
          <div>
            <SimpleProcessingOptions
              onProcessingChange={setProcessingConfig}
              currentDocument={document}
            />
          </div>
        </div>

        {/* Summary Preview Section - Full Width */}
        <div className="w-full">
          <Card className="shadow-sm border border-border bg-card">
            <Tabs defaultValue="summary" className="w-full">
              <div className="border-b border-border">
                <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-0">
                  <TabsTrigger 
                    value="summary" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-valley-primary data-[state=active]:text-valley-primary rounded-none py-4"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Summary Preview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="extracted"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-valley-primary data-[state=active]:text-valley-primary rounded-none py-4"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Extracted Data
                  </TabsTrigger>
                  <TabsTrigger 
                    value="export"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-valley-primary data-[state=active]:text-valley-primary rounded-none py-4"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export Options
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="summary" className="mt-0">
                <CleanSummaryPreview document={document} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="extracted" className="mt-0">
                <ExtractedData document={document} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="export" className="mt-0">
                <ExportOptions documentId={currentDocumentId} isReady={!!isDocumentReady} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Quick Actions Bar */}
        <div className="mt-8 bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {document?.processed ? 'Processing completed' : 'Processing...'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>
                  {documentsList?.length || 0} document(s) processed
                </span>
              </div>
              {isDocumentReady && (
                <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                  <span>Ready for export</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsHistoryDialogOpen(true)}
                disabled={!currentDocumentId}
              >
                <Clock className="w-4 h-4 mr-2" />
                View History
              </Button>
              <Button 
                className="valley-secondary valley-secondary-hover"
                disabled={!isDocumentReady || exportPDFMutation.isPending}
                onClick={handleExportPDF}
              >
                <FileText className="w-4 h-4 mr-2" />
                {exportPDFMutation.isPending ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button variant="outline" onClick={() => setCurrentDocumentId(null)}>
                <FileText className="w-4 h-4 mr-2" />
                New Summary
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Summary History Dialog */}
      <SummaryHistoryDialog
        documentId={currentDocumentId}
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
      />
    </div>
  );
}
