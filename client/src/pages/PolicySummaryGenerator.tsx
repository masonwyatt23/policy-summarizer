import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { CleanSummaryPreview } from '@/components/CleanSummaryPreview';
import { SummaryEditor } from '@/components/SummaryEditor';
import { SummaryHistoryDialog } from '@/components/SummaryHistoryDialog';
import { Clock, FileText, CheckCircle, User, Eye, Edit3 } from 'lucide-react';
import { api, type ProcessedDocument, type DocumentListItem } from '@/lib/api';
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
  const [editedSummary, setEditedSummary] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>("preview");
  const { toast } = useToast();

  // Update currentDocumentId when documentId prop changes
  useEffect(() => {
    if (documentId) {
      setCurrentDocumentId(parseInt(documentId, 10));
    }
  }, [documentId]);

  // Clear edited summary when document changes
  useEffect(() => {
    setEditedSummary('');
  }, [currentDocumentId]);

  const { data: document, isLoading, refetch } = useQuery<ProcessedDocument>({
    queryKey: [`/api/documents/${currentDocumentId}`],
    enabled: !!currentDocumentId,
    refetchInterval: 5000, // Poll every 5 seconds
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
        customSummary: editedSummary || undefined, // Use edited summary if available for preview
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

  const handleSummaryUpdate = (updatedSummary: string) => {
    setEditedSummary(updatedSummary);
    // You can also trigger a backend update here if needed
  };

  const isDocumentReady = document?.processed && document?.extractedData;

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
        {/* Upload Section */}
        <div className="mb-8">
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Summary Tabs Section */}
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview" className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Summary Preview</span>
              </TabsTrigger>
              <TabsTrigger value="edit" className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4" />
                <span>Edit Summary</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="mt-4">
              <Card className="shadow-sm border border-border bg-card">
                <div className="border-b border-border p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-valley-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Policy Summary Preview</h2>
                  </div>
                </div>
                <div className="p-0">
                  <CleanSummaryPreview document={document as any || null} isLoading={isLoading} editedSummary={editedSummary} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="edit" className="mt-4">
              <SummaryEditor 
                document={document as any || null} 
                onSummaryUpdate={handleSummaryUpdate}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Quick Actions Bar */}
        <div className="mt-8 bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {!currentDocumentId 
                    ? 'No document selected'
                    : isLoading 
                      ? 'Processing document...'
                      : document?.processed 
                        ? 'Processing completed' 
                        : 'Ready to process'
                  }
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
