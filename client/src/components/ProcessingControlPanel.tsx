import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  User, 
  FileText, 
  Brain, 
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Save,
  RotateCcw
} from 'lucide-react';

interface ProcessingControlPanelProps {
  onProcessingChange?: (config: ProcessingConfig) => void;
  currentDocument?: any;
}

interface ProcessingConfig {
  // AI Analysis Options
  analysisDepth: 'basic' | 'standard' | 'comprehensive';
  extractionFocus: string[];
  languageComplexity: 'simple' | 'professional' | 'technical';
  
  // Client Information
  clientName: string;
  policyReference: string;
  agentNotes: string;
  
  // Output Formatting
  includeRiskAssessment: boolean;
  generateRecommendations: boolean;
  highlightKeyTerms: boolean;
  includeCoverageComparison: boolean;
  
  // Template Options
  summaryTemplate: 'standard' | 'detailed' | 'executive' | 'client-friendly';
  priorityLevel: 'routine' | 'urgent' | 'critical';
}

export function ProcessingControlPanel({ onProcessingChange, currentDocument }: ProcessingControlPanelProps) {
  const [config, setConfig] = useState<ProcessingConfig>({
    analysisDepth: 'standard',
    extractionFocus: ['coverage', 'exclusions', 'premiums'],
    languageComplexity: 'professional',
    clientName: '',
    policyReference: '',
    agentNotes: '',
    includeRiskAssessment: true,
    generateRecommendations: true,
    highlightKeyTerms: true,
    includeCoverageComparison: false,
    summaryTemplate: 'standard',
    priorityLevel: 'routine'
  });

  const [savedConfigs, setSavedConfigs] = useState<string[]>([
    'Standard Business Policy',
    'Personal Insurance Review',
    'Commercial Coverage Analysis'
  ]);

  const updateConfig = (updates: Partial<ProcessingConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onProcessingChange?.(newConfig);
  };

  const toggleExtractionFocus = (focus: string) => {
    const newFocus = config.extractionFocus.includes(focus)
      ? config.extractionFocus.filter(f => f !== focus)
      : [...config.extractionFocus, focus];
    updateConfig({ extractionFocus: newFocus });
  };

  const saveCurrentConfig = () => {
    const name = `Custom Config ${savedConfigs.length + 1}`;
    setSavedConfigs([...savedConfigs, name]);
  };

  const resetToDefault = () => {
    const defaultConfig: ProcessingConfig = {
      analysisDepth: 'standard',
      extractionFocus: ['coverage', 'exclusions', 'premiums'],
      languageComplexity: 'professional',
      clientName: '',
      policyReference: '',
      agentNotes: '',
      includeRiskAssessment: true,
      generateRecommendations: true,
      highlightKeyTerms: true,
      includeCoverageComparison: false,
      summaryTemplate: 'standard',
      priorityLevel: 'routine'
    };
    setConfig(defaultConfig);
    onProcessingChange?.(defaultConfig);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Processing Control Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis" className="text-xs">
              <Brain className="w-4 h-4 mr-1" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="client" className="text-xs">
              <User className="w-4 h-4 mr-1" />
              Client
            </TabsTrigger>
            <TabsTrigger value="output" className="text-xs">
              <FileText className="w-4 h-4 mr-1" />
              Output
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            {/* Analysis Depth */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Analysis Depth</Label>
              <Select value={config.analysisDepth} onValueChange={(value: any) => updateConfig({ analysisDepth: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Basic (Quick overview)
                    </div>
                  </SelectItem>
                  <SelectItem value="standard">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Standard (Recommended)
                    </div>
                  </SelectItem>
                  <SelectItem value="comprehensive">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Comprehensive (Deep analysis)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Extraction Focus */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Extraction Focus</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'coverage',
                  'exclusions',
                  'premiums',
                  'deductibles',
                  'limits',
                  'conditions'
                ].map((focus) => (
                  <div key={focus} className="flex items-center space-x-2">
                    <Checkbox
                      id={focus}
                      checked={config.extractionFocus.includes(focus)}
                      onCheckedChange={() => toggleExtractionFocus(focus)}
                    />
                    <Label htmlFor={focus} className="text-xs capitalize">
                      {focus}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Language Complexity */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Language Style</Label>
              <Select value={config.languageComplexity} onValueChange={(value: any) => updateConfig({ languageComplexity: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple (Client-friendly)</SelectItem>
                  <SelectItem value="professional">Professional (Agent use)</SelectItem>
                  <SelectItem value="technical">Technical (Expert review)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="client" className="space-y-4 mt-4">
            {/* Client Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-sm font-medium">Client Name</Label>
                <Input
                  id="clientName"
                  placeholder="e.g., John Smith"
                  value={config.clientName}
                  onChange={(e) => updateConfig({ clientName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="policyRef" className="text-sm font-medium">Policy Reference</Label>
                <Input
                  id="policyRef"
                  placeholder="e.g., POL-2024-12345"
                  value={config.policyReference}
                  onChange={(e) => updateConfig({ policyReference: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentNotes" className="text-sm font-medium">Agent Notes</Label>
                <Textarea
                  id="agentNotes"
                  placeholder="Special instructions, client preferences, key concerns..."
                  value={config.agentNotes}
                  onChange={(e) => updateConfig({ agentNotes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Priority Level</Label>
                <Select value={config.priorityLevel} onValueChange={(value: any) => updateConfig({ priorityLevel: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Routine
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Urgent
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Critical
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="output" className="space-y-4 mt-4">
            {/* Output Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Enhanced Features</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="riskAssessment"
                    checked={config.includeRiskAssessment}
                    onCheckedChange={(checked) => updateConfig({ includeRiskAssessment: !!checked })}
                  />
                  <Label htmlFor="riskAssessment" className="text-sm">
                    Risk Assessment Analysis
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recommendations"
                    checked={config.generateRecommendations}
                    onCheckedChange={(checked) => updateConfig({ generateRecommendations: !!checked })}
                  />
                  <Label htmlFor="recommendations" className="text-sm">
                    Generate Recommendations
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="highlightTerms"
                    checked={config.highlightKeyTerms}
                    onCheckedChange={(checked) => updateConfig({ highlightKeyTerms: !!checked })}
                  />
                  <Label htmlFor="highlightTerms" className="text-sm">
                    Highlight Key Terms
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="coverageComparison"
                    checked={config.includeCoverageComparison}
                    onCheckedChange={(checked) => updateConfig({ includeCoverageComparison: !!checked })}
                  />
                  <Label htmlFor="coverageComparison" className="text-sm">
                    Coverage Gap Analysis
                  </Label>
                </div>
              </div>
            </div>

            {/* Summary Template */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Summary Template</Label>
              <Select value={config.summaryTemplate} onValueChange={(value: any) => updateConfig({ summaryTemplate: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Report</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                  <SelectItem value="executive">Executive Summary</SelectItem>
                  <SelectItem value="client-friendly">Client Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Actions</Label>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={saveCurrentConfig}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetToDefault}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {/* Saved Configurations */}
        {savedConfigs.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Saved Configurations</Label>
            <div className="space-y-1">
              {savedConfigs.slice(0, 3).map((configName, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                >
                  <Sparkles className="w-3 h-3 mr-2" />
                  {configName}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800 font-medium">
              Configuration Ready
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {config.analysisDepth === 'comprehensive' ? 'Deep analysis enabled' : 
             config.analysisDepth === 'basic' ? 'Quick processing mode' : 
             'Standard processing mode'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}