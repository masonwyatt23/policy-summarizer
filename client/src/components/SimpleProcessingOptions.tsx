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
    <Card className="h-full bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Processing Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Client Name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Client Name</Label>
          <Input
            placeholder="Enter client name"
            value={config.clientName}
            onChange={(e) => updateConfig({ clientName: e.target.value })}
            className="text-sm"
          />
        </div>

        {/* Summary Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Summary Type</Label>
          <Select value={config.summaryStyle} onValueChange={(value: any) => updateConfig({ summaryStyle: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brief">Brief Summary</SelectItem>
              <SelectItem value="standard">Standard Report</SelectItem>
              <SelectItem value="comprehensive">Detailed Analysis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Include Recommendations */}
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

        {/* Status */}
        <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800 text-center">
          <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">Ready to Process</span>
        </div>
      </CardContent>
    </Card>
  );
}