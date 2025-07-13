import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/FileUpload';
import { CleanSummaryPreview } from '@/components/CleanSummaryPreview';
import { SummaryEditor } from '@/components/SummaryEditor';
import { SummaryHistoryDialog } from '@/components/SummaryHistoryDialog';
import { Clock, FileText, CheckCircle, User, Eye, Edit3, Download, Image, X, Upload, LogOut, RefreshCw } from 'lucide-react';
import { api, type ProcessedDocument, type DocumentListItem } from '@/lib/api';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientLogo, setClientLogo] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [summaryLength, setSummaryLength] = useState<'short' | 'detailed'>('detailed');
  const { toast } = useToast();
  const { agent, logout, isLoggingOut } = useAuth();
  const queryClient = useQueryClient();

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

  // Check if document's summary format differs from selected format
  const getDocumentSummaryLength = (): 'short' | 'detailed' | undefined => {
    if (!document?.processingOptions) return undefined;
    try {
      const options = typeof document.processingOptions === 'string' 
        ? JSON.parse(document.processingOptions) 
        : document.processingOptions;
      return options.summaryLength || 'detailed';
    } catch {
      return 'detailed';
    }
  };

  const documentSummaryLength = getDocumentSummaryLength();
  const needsRegeneration = document && documentSummaryLength && documentSummaryLength !== summaryLength;

  // Regenerate summary mutation
  const regenerateSummaryMutation = useMutation({
    mutationFn: async () => {
      if (!currentDocumentId) throw new Error('No document selected');
      return api.regenerateSummary(currentDocumentId, summaryLength);
    },
    onSuccess: (result) => {
      toast({
        title: "Summary Regenerated",
        description: `Successfully generated ${summaryLength === 'short' ? 'concise' : 'detailed'} summary.`,
      });
      // Update the query cache with the new document data
      queryClient.setQueryData([`/api/documents/${currentDocumentId}`], result.document);
      // Clear edited summary since we have a new one
      setEditedSummary('');
    },
    onError: (error) => {
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate summary",
        variant: "destructive",
      });
    },
  });

  // PDF Export mutation
  const exportPDFMutation = useMutation({
    mutationFn: async ({ documentId, filename, clientName, clientLogo }: { 
      documentId: number; 
      filename: string; 
      clientName?: string; 
      clientLogo?: string; 
    }) => {
      const options = {
        clientName: clientName || '',
        policyReference: '',
        clientLogo: clientLogo || '',
        includeExplanations: true,
        includeTechnicalDetails: false,
        includeBranding: true,
        customSummary: editedSummary || undefined, // Use edited summary if available for preview
      };
      
      const blob = await api.exportPDF(documentId, options);
      
      // Download the PDF with custom filename
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(link);
    },
    onSuccess: () => {
      setIsExportDialogOpen(false);
      toast({
        title: "Export Successful",
        description: "PDF has been downloaded successfully.",
      });
      // Force refetch of document data to refresh the PDF export count
      console.log('PDF export successful - forcing cache refresh');
      queryClient.refetchQueries({ queryKey: ['/api/documents'] });
      queryClient.refetchQueries({ queryKey: ['/api/documents', documentId] });
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
    if (currentDocumentId && document) {
      // Generate default filename based on document info
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      const timeStr = new Date().toISOString().split('T')[1].substring(0, 5).replace(':', ''); // HHMM
      const defaultFilename = `policy-summary-${dateStr}-${timeStr}`;
      
      setExportFilename(defaultFilename);
      setIsExportDialogOpen(true);
    }
  };

  const handleConfirmExport = () => {
    if (currentDocumentId && exportFilename.trim()) {
      exportPDFMutation.mutate({ 
        documentId: currentDocumentId, 
        filename: exportFilename.trim(),
        clientName: clientName.trim(),
        clientLogo: clientLogo
      });
    }
  };

  const handleSummaryUpdate = (updatedSummary: string) => {
    setEditedSummary(updatedSummary);
    // You can also trigger a backend update here if needed
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setClientLogo(base64);
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setClientLogo('');
    setLogoPreview('');
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
              <div className="hidden md:flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>{agent?.fullName || agent?.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  disabled={isLoggingOut}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Length Selection - Before Upload */}
        <div className="mb-6">
          <Card className="bg-card border border-border shadow-sm">
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5 text-valley-primary" />
                <h3 className="text-lg font-semibold text-foreground">Summary Format</h3>
                <span className="text-sm text-muted-foreground">- Choose your preferred summary length</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="summaryLength" className="text-sm font-medium">
                    Select Summary Length
                  </Label>
                  <Select value={summaryLength} onValueChange={(value: 'short' | 'detailed') => setSummaryLength(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select summary length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Concise (1 paragraph, 150-200 words)</SelectItem>
                      <SelectItem value="detailed">Detailed (5 paragraphs, 400-600 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Selected Format
                  </Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium text-foreground">
                      {summaryLength === 'short' ? 'Concise Summary' : 'Detailed Summary'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {summaryLength === 'short' 
                        ? 'Single paragraph format ideal for quick reviews and executive briefings'
                        : 'Comprehensive 5-paragraph format with detailed analysis and recommendations'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <FileUpload 
            onUploadSuccess={handleUploadSuccess} 
            summaryLength={summaryLength}
          />
        </div>

        {/* Regeneration Notice */}
        {needsRegeneration && (
          <div className="mb-6">
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Summary Format Mismatch
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      This document was processed with a {documentSummaryLength === 'short' ? 'concise' : 'detailed'} summary, 
                      but you've selected {summaryLength === 'short' ? 'concise' : 'detailed'} format. 
                      Would you like to regenerate the summary?
                    </p>
                    <Button
                      size="sm"
                      onClick={() => regenerateSummaryMutation.mutate()}
                      disabled={regenerateSummaryMutation.isPending}
                      className="mt-3"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${regenerateSummaryMutation.isPending ? 'animate-spin' : ''}`} />
                      {regenerateSummaryMutation.isPending ? 'Regenerating...' : 'Regenerate Summary'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

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

        {/* Client Options Section */}
        {isDocumentReady && (
          <div className="mt-6 bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-valley-primary" />
              <h3 className="text-lg font-semibold text-foreground">Client Information (Optional)</h3>
              <span className="text-sm text-muted-foreground">- Personalize your PDF export</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Name */}
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-sm font-medium">
                  Client Name
                </Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client or business name"
                  className="w-full"
                />
              </div>

              {/* Client Logo Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Client Logo
                </Label>
                <div className="space-y-3">
                  {!logoPreview ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-valley-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload client logo
                        </span>
                        <span className="text-xs text-muted-foreground">
                          PNG, JPG up to 2MB
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="border border-border rounded-lg p-2 bg-background">
                        <img
                          src={logoPreview}
                          alt="Client logo preview"
                          className="w-full h-20 object-contain rounded"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 rounded-full p-1 h-6 w-6 bg-background border border-border hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {(clientName || logoPreview) && (
              <div className="mt-4 p-3 bg-muted rounded-lg border-l-4 border-valley-primary">
                <div className="flex items-start space-x-2">
                  <Image className="w-4 h-4 text-valley-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">PDF will include:</p>
                    <ul className="text-muted-foreground mt-1 space-y-1">
                      {clientName && <li>• Client name: {clientName}</li>}
                      {logoPreview && <li>• Client logo in document header</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
      
      {/* Export PDF Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Export PDF</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filename" className="text-right">
                Filename
              </Label>
              <Input
                id="filename"
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                className="col-span-3"
                placeholder="Enter filename"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              The .pdf extension will be added automatically if not included.
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
              disabled={exportPDFMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmExport}
              disabled={!exportFilename.trim() || exportPDFMutation.isPending}
              className="valley-secondary valley-secondary-hover"
            >
              {exportPDFMutation.isPending ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
