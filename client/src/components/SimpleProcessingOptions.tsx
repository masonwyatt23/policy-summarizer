import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  User, 
  FileText, 
  Zap,
  Target,
  Save
} from 'lucide-react';

interface SimpleProcessingOptionsProps {
  onProcessingChange?: (config: ProcessingConfig) => void;
  currentDocument?: any;
}

interface ProcessingConfig {
  analysisType: 'quick' | 'standard' | 'detailed';
  clientName: string;
  policyReference: string;
  includeRecommendations: boolean;
  highlightKeyTerms: boolean;
  summaryStyle: 'brief' | 'standard' | 'comprehensive';
}

export function SimpleProcessingOptions({ onProcessingChange }: SimpleProcessingOptionsProps) {
  const [config, setConfig] = useState<ProcessingConfig>({
    analysisType: 'standard',
    clientName: '',
    policyReference: '',
    includeRecommendations: true,
    highlightKeyTerms: true,
    summaryStyle: 'standard'
  });

  const updateConfig = (updates: Partial<ProcessingConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onProcessingChange?.(newConfig);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Processing Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Analysis Type</Label>
          <Select value={config.analysisType} onValueChange={(value: any) => updateConfig({ analysisType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quick">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Quick Analysis
                </div>
              </SelectItem>
              <SelectItem value="standard">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Standard Analysis
                </div>
              </SelectItem>
              <SelectItem value="detailed">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Detailed Analysis
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Client Information */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            Client Information
          </Label>
          
          <div className="space-y-2">
            <Input
              placeholder="Client Name"
              value={config.clientName}
              onChange={(e) => updateConfig({ clientName: e.target.value })}
              className="text-sm"
            />
            <Input
              placeholder="Policy Reference"
              value={config.policyReference}
              onChange={(e) => updateConfig({ policyReference: e.target.value })}
              className="text-sm"
            />
          </div>
        </div>

        {/* Processing Features */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Enhanced Features</Label>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recommendations"
                checked={config.includeRecommendations}
                onCheckedChange={(checked) => updateConfig({ includeRecommendations: !!checked })}
              />
              <Label htmlFor="recommendations" className="text-sm">
                Include Recommendations
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
          </div>
        </div>

        {/* Summary Style */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Summary Style</Label>
          <Select value={config.summaryStyle} onValueChange={(value: any) => updateConfig({ summaryStyle: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brief">Brief Summary</SelectItem>
              <SelectItem value="standard">Standard Report</SelectItem>
              <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Save */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => {
            // Save current config logic
            console.log('Saving config:', config);
          }}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>

        {/* Status */}
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-800 font-medium">
              Ready to Process
            </span>
          </div>
          <div className="mt-1 flex gap-1">
            <Badge variant="outline" className="text-xs">
              {config.analysisType}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {config.summaryStyle}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}