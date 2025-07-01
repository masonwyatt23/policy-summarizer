import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Settings, 
  Brain, 
  FileText, 
  AlertTriangle, 
  Target,
  Zap,
  CheckCircle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ProcessingOptionsSchema = z.object({
  extractCoverage: z.boolean().default(true),
  generateExplanations: z.boolean().default(true),
  includeImportance: z.boolean().default(true),
  detailLevel: z.enum(["basic", "standard", "comprehensive", "expert"]).default("comprehensive"),
  focusAreas: z.array(z.enum(["coverage", "exclusions", "eligibility", "benefits", "contacts", "claims"])).default(["coverage", "exclusions", "eligibility"]),
  outputFormat: z.enum(["structured", "narrative", "bullet", "detailed"]).default("structured"),
  includeComparisons: z.boolean().default(false),
  generateRecommendations: z.boolean().default(false),
  highlightRisks: z.boolean().default(true),
  includeScenarios: z.boolean().default(false),
});

type ProcessingOptions = z.infer<typeof ProcessingOptionsSchema>;

interface AdvancedProcessingOptionsProps {
  initialOptions?: Partial<ProcessingOptions>;
  onOptionsChange?: (options: ProcessingOptions) => void;
  onSaveAsDefault?: (options: ProcessingOptions) => void;
  isProcessing?: boolean;
}

export function AdvancedProcessingOptions({
  initialOptions = {},
  onOptionsChange,
  onSaveAsDefault,
  isProcessing = false
}: AdvancedProcessingOptionsProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  const form = useForm<ProcessingOptions>({
    resolver: zodResolver(ProcessingOptionsSchema),
    defaultValues: {
      extractCoverage: true,
      generateExplanations: true,
      includeImportance: true,
      detailLevel: "comprehensive",
      focusAreas: ["coverage", "exclusions", "eligibility"],
      outputFormat: "structured",
      includeComparisons: false,
      generateRecommendations: false,
      highlightRisks: true,
      includeScenarios: false,
      ...initialOptions,
    },
  });

  const watchedValues = form.watch();

  const handleFormChange = (values: ProcessingOptions) => {
    onOptionsChange?.(values);
  };

  const focusAreaOptions = [
    { id: "coverage", label: "Coverage Details", icon: CheckCircle, description: "Extract specific coverage limits and conditions" },
    { id: "exclusions", label: "Exclusions", icon: AlertTriangle, description: "Identify what's not covered" },
    { id: "eligibility", label: "Eligibility", icon: Target, description: "Age limits and qualification requirements" },
    { id: "benefits", label: "Benefits", icon: Zap, description: "Key policy benefits and advantages" },
    { id: "contacts", label: "Contact Information", icon: Info, description: "Important phone numbers and contacts" },
    { id: "claims", label: "Claims Process", icon: FileText, description: "How to file claims and required documents" },
  ];

  const detailLevelDescriptions = {
    basic: "Essential information only - quick overview",
    standard: "Key details with basic explanations",
    comprehensive: "Detailed analysis with thorough explanations",
    expert: "Expert-level analysis with technical insights"
  };

  const outputFormatDescriptions = {
    structured: "Organized sections with clear headings",
    narrative: "Flowing paragraph format",
    bullet: "Concise bullet point format",
    detailed: "Comprehensive with examples and context"
  };

  return (
    <Form {...form}>
      <form onChange={() => handleFormChange(form.getValues())} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>AI Processing Options</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Core Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="extractCoverage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Coverage Extraction
                      </FormLabel>
                      <FormDescription className="text-sm">
                        Extract detailed coverage limits and amounts
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isProcessing}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="generateExplanations"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Generate Explanations
                      </FormLabel>
                      <FormDescription className="text-sm">
                        Add client-friendly explanations
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isProcessing}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="highlightRisks"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Risk Highlighting
                      </FormLabel>
                      <FormDescription className="text-sm">
                        Identify potential coverage gaps
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isProcessing}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Detail Level and Output Format */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="detailLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Analysis Detail Level</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isProcessing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select detail level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(detailLevelDescriptions).map(([value, description]) => (
                          <SelectItem key={value} value={value}>
                            <div>
                              <div className="font-medium capitalize">{value}</div>
                              <div className="text-sm text-gray-500">{description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {detailLevelDescriptions[field.value]}
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outputFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Output Format</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isProcessing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select output format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(outputFormatDescriptions).map(([value, description]) => (
                          <SelectItem key={value} value={value}>
                            <div>
                              <div className="font-medium capitalize">{value}</div>
                              <div className="text-sm text-gray-500">{description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {outputFormatDescriptions[field.value]}
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Focus Areas */}
            <FormField
              control={form.control}
              name="focusAreas"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base font-medium">Analysis Focus Areas</FormLabel>
                    <FormDescription>
                      Select which aspects of the policy to analyze in detail
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {focusAreaOptions.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="focusAreas"
                        render={({ field }) => {
                          const Icon = item.icon;
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id as any)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item.id])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== item.id)
                                        );
                                  }}
                                  disabled={isProcessing}
                                />
                              </FormControl>
                              <div className="flex items-start space-x-2 flex-1">
                                <Icon className="w-4 h-4 mt-0.5 text-blue-500" />
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm font-medium">
                                    {item.label}
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    {item.description}
                                  </FormDescription>
                                </div>
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />

            {/* Advanced Options */}
            <Collapsible
              open={isAdvancedOpen}
              onOpenChange={setIsAdvancedOpen}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Advanced Options</span>
                  </span>
                  <Badge variant="secondary">
                    {[watchedValues.includeComparisons, watchedValues.generateRecommendations, watchedValues.includeScenarios].filter(Boolean).length} enabled
                  </Badge>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="includeComparisons"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">
                            Industry Comparisons
                          </FormLabel>
                          <FormDescription className="text-sm">
                            Compare with industry standards
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isProcessing}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="generateRecommendations"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">
                            Generate Recommendations
                          </FormLabel>
                          <FormDescription className="text-sm">
                            Provide policy improvement suggestions
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isProcessing}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeScenarios"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">
                            Include Scenarios
                          </FormLabel>
                          <FormDescription className="text-sm">
                            Show practical usage examples
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isProcessing}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onSaveAsDefault?.(form.getValues())}
                disabled={isProcessing}
              >
                Save as Default
              </Button>
              
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={isProcessing}
                >
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}