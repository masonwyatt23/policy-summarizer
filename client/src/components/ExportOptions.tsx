import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, Mail, Printer, Info } from 'lucide-react';
import { api, ExportOptions as ApiExportOptions } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ExportOptionsProps {
  documentId: number | null;
  isReady: boolean;
}

export function ExportOptions({ documentId, isReady }: ExportOptionsProps) {
  const [exportSettings, setExportSettings] = useState({
    templateStyle: 'professional',
    clientName: '',
    policyReference: '',
    includeSummary: true,
    includeExplanations: true,
    includeTechnicalDetails: false,
    includeBranding: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!documentId) {
      toast({
        title: "No document selected",
        description: "Please process a document first.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const options: ApiExportOptions = {
        clientName: exportSettings.clientName || undefined,
        policyReference: exportSettings.policyReference || undefined,
        includeExplanations: exportSettings.includeExplanations,
        includeTechnicalDetails: exportSettings.includeTechnicalDetails,
        includeBranding: exportSettings.includeBranding,
      };

      const pdfBlob = await api.exportPDF(documentId, options);
      
      // Download the PDF
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `policy-summary-${exportSettings.clientName || 'document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF exported successfully",
        description: "Your policy summary has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Export & Delivery Options</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 text-red-500 mr-2" />
              PDF Export Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="templateStyle" className="text-sm font-medium text-slate-700 mb-2 block">
                  Template Style
                </Label>
                <Select
                  value={exportSettings.templateStyle}
                  onValueChange={(value) => setExportSettings(prev => ({ ...prev, templateStyle: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional Summary (Recommended)</SelectItem>
                    <SelectItem value="detailed">Detailed Technical Report</SelectItem>
                    <SelectItem value="client-friendly">Client-Friendly Overview</SelectItem>
                    <SelectItem value="quick-reference">Quick Reference Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Include Sections
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSummary"
                      checked={exportSettings.includeSummary}
                      onCheckedChange={(checked) => 
                        setExportSettings(prev => ({ ...prev, includeSummary: !!checked }))
                      }
                    />
                    <Label htmlFor="includeSummary" className="text-sm text-slate-700">
                      Coverage summary
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeExplanations"
                      checked={exportSettings.includeExplanations}
                      onCheckedChange={(checked) => 
                        setExportSettings(prev => ({ ...prev, includeExplanations: !!checked }))
                      }
                    />
                    <Label htmlFor="includeExplanations" className="text-sm text-slate-700">
                      Plain language explanations
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeTechnicalDetails"
                      checked={exportSettings.includeTechnicalDetails}
                      onCheckedChange={(checked) => 
                        setExportSettings(prev => ({ ...prev, includeTechnicalDetails: !!checked }))
                      }
                    />
                    <Label htmlFor="includeTechnicalDetails" className="text-sm text-slate-700">
                      Technical policy details
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeBranding"
                      checked={exportSettings.includeBranding}
                      onCheckedChange={(checked) => 
                        setExportSettings(prev => ({ ...prev, includeBranding: !!checked }))
                      }
                    />
                    <Label htmlFor="includeBranding" className="text-sm text-slate-700">
                      Valley Trust branding
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Client Information
                </Label>
                <Input
                  placeholder="Client Name (optional)"
                  value={exportSettings.clientName}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, clientName: e.target.value }))}
                  className="mb-2"
                />
                <Input
                  placeholder="Policy Reference (optional)"
                  value={exportSettings.policyReference}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, policyReference: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
              <Download className="w-5 h-5 text-blue-500 mr-2" />
              Delivery Options
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">Download PDF</span>
                </div>
                <Button
                  onClick={handleExport}
                  disabled={!isReady || isExporting}
                  className="valley-primary valley-primary-hover"
                >
                  {isExporting ? 'Exporting...' : 'Download'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">Email to Client</span>
                </div>
                <Button variant="outline" disabled>
                  Setup
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                <div className="flex items-center space-x-3">
                  <Printer className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">Print Ready</span>
                </div>
                <Button variant="outline" disabled>
                  Preview
                </Button>
              </div>
            </div>

            {isReady && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">PDF Export Ready</p>
                    <p>Your policy summary has been processed and is ready for export with Valley Trust Insurance branding.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
