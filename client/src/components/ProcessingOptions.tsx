import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ProcessingOptionsProps {
  options: {
    extractCoverage: boolean;
    generateExplanations: boolean;
    includeImportance: boolean;
  };
  onChange: (options: any) => void;
}

export function ProcessingOptions({ options, onChange }: ProcessingOptionsProps) {
  const handleOptionChange = (key: string, value: boolean) => {
    onChange({
      ...options,
      [key]: value,
    });
  };

  return (
    <div className="pt-6 border-t border-slate-200">
      <h3 className="text-sm font-medium text-slate-900 mb-3">Processing Options</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="extractCoverage"
            checked={options.extractCoverage}
            onCheckedChange={(checked) => handleOptionChange('extractCoverage', !!checked)}
          />
          <Label htmlFor="extractCoverage" className="text-sm text-slate-700">
            Extract coverage details
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="generateExplanations"
            checked={options.generateExplanations}
            onCheckedChange={(checked) => handleOptionChange('generateExplanations', !!checked)}
          />
          <Label htmlFor="generateExplanations" className="text-sm text-slate-700">
            Generate plain language explanations
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeImportance"
            checked={options.includeImportance}
            onCheckedChange={(checked) => handleOptionChange('includeImportance', !!checked)}
          />
          <Label htmlFor="includeImportance" className="text-sm text-slate-700">
            Include coverage importance notes
          </Label>
        </div>
      </div>
    </div>
  );
}
