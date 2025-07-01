import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { ProcessingOptions } from '@/components/ProcessingOptions';
import { SummaryPreview } from '@/components/SummaryPreview';
import { ExtractedData } from '@/components/ExtractedData';
import { ExportOptions } from '@/components/ExportOptions';
import { Clock, FileText, CheckCircle, Settings, User } from 'lucide-react';
import { api } from '@/lib/api';
import logoPath from '@assets/Valley-Trust-Insurance-Logo_1751344889285.png';

export default function PolicySummaryGenerator() {
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null);
  const [processingOptions, setProcessingOptions] = useState({
    extractCoverage: true,
    generateExplanations: true,
    includeImportance: false,
  });

  const { data: document, isLoading, refetch } = useQuery({
    queryKey: ['/api/documents', currentDocumentId],
    enabled: !!currentDocumentId,
    refetchInterval: (data) => {
      // Keep polling if document is still being processed
      return data?.processed === false ? 5000 : false;
    },
  });

  const { data: documentsList } = useQuery({
    queryKey: ['/api/documents'],
  });

  const handleUploadSuccess = (documentId: number) => {
    setCurrentDocumentId(documentId);
  };

  const isDocumentReady = document?.processed && !document?.processingError && document?.extractedData;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src={logoPath} alt="Valley Trust Insurance" className="h-10 w-auto" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-slate-900">Policy Summary Generator</h1>
                <p className="text-sm text-slate-500">Internal Agent Tool</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-slate-600">
                <User className="w-5 h-5" />
                <span>Agent Portal</span>
              </div>
              <Button variant="outline" className="valley-primary-hover">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1 space-y-6">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
            
            <Card>
              <ProcessingOptions
                options={processingOptions}
                onChange={setProcessingOptions}
              />
            </Card>
          </div>

          {/* Summary Preview Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border border-slate-200">
              <Tabs defaultValue="summary" className="w-full">
                <div className="border-b border-slate-200">
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
                  <SummaryPreview document={document} isLoading={isLoading} />
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
        </div>

        {/* Quick Actions Bar */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  {document?.processed ? 'Processing completed' : 'Processing...'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>
                  {documentsList?.length || 0} document(s) processed
                </span>
              </div>
              {isDocumentReady && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Ready for export</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Clock className="w-4 h-4 mr-2" />
                View History
              </Button>
              <Button 
                className="valley-secondary valley-secondary-hover"
                disabled={!isDocumentReady}
              >
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => setCurrentDocumentId(null)}>
                <FileText className="w-4 h-4 mr-2" />
                New Summary
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
