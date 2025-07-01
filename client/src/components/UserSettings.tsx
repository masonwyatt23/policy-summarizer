import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Settings, 
  User, 
  Palette, 
  FileText, 
  Download,
  Bell,
  Shield,
  HelpCircle,
  Save,
  RefreshCw,
  Eye,
  Monitor,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const UserSettingsSchema = z.object({
  defaultProcessingOptions: z.object({
    extractCoverage: z.boolean().default(true),
    generateExplanations: z.boolean().default(true),
    includeImportance: z.boolean().default(true),
    detailLevel: z.enum(["basic", "standard", "comprehensive", "expert"]).default("comprehensive"),
    focusAreas: z.array(z.string()).default(["coverage", "exclusions", "eligibility"]),
    outputFormat: z.enum(["structured", "narrative", "bullet", "detailed"]).default("structured"),
    includeComparisons: z.boolean().default(false),
    generateRecommendations: z.boolean().default(false),
    highlightRisks: z.boolean().default(true),
    includeScenarios: z.boolean().default(false),
  }),
  exportPreferences: z.object({
    includeBranding: z.boolean().default(true),
    includeExplanations: z.boolean().default(true),
    includeTechnicalDetails: z.boolean().default(false),
    defaultClientName: z.string().default(""),
    defaultPolicyReference: z.string().default(""),
  }),
  uiPreferences: z.object({
    theme: z.enum(["light", "dark", "system"]).default("light"),
    compactView: z.boolean().default(false),
    autoRefresh: z.boolean().default(true),
    showPreview: z.boolean().default(true),
  }),
});

type UserSettingsData = z.infer<typeof UserSettingsSchema>;

export function UserSettings() {
  const [activeTab, setActiveTab] = useState("processing");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
  });

  const form = useForm<UserSettingsData>({
    resolver: zodResolver(UserSettingsSchema),
    defaultValues: settings || {
      defaultProcessingOptions: {
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
      },
      exportPreferences: {
        includeBranding: true,
        includeExplanations: true,
        includeTechnicalDetails: false,
        defaultClientName: "",
        defaultPolicyReference: "",
      },
      uiPreferences: {
        theme: "light",
        compactView: false,
        autoRefresh: true,
        showPreview: true,
      },
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: UserSettingsData) => {
      return apiRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error saving settings",
        description: "There was a problem updating your preferences.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserSettingsData) => {
    updateSettingsMutation.mutate(data);
  };

  const resetToDefaults = () => {
    form.reset({
      defaultProcessingOptions: {
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
      },
      exportPreferences: {
        includeBranding: true,
        includeExplanations: true,
        includeTechnicalDetails: false,
        defaultClientName: "",
        defaultPolicyReference: "",
      },
      uiPreferences: {
        theme: "light",
        compactView: false,
        autoRefresh: true,
        showPreview: true,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Settings className="w-6 h-6" />
            <span>Settings</span>
          </h1>
          <p className="text-gray-600">Customize your document processing preferences</p>
        </div>
        <Badge variant="outline">Valley Trust Insurance</Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="processing">
                <FileText className="w-4 h-4 mr-2" />
                Processing
              </TabsTrigger>
              <TabsTrigger value="export">
                <Download className="w-4 h-4 mr-2" />
                Export
              </TabsTrigger>
              <TabsTrigger value="interface">
                <Monitor className="w-4 h-4 mr-2" />
                Interface
              </TabsTrigger>
              <TabsTrigger value="account">
                <User className="w-4 h-4 mr-2" />
                Account
              </TabsTrigger>
            </TabsList>

            {/* Processing Settings */}
            <TabsContent value="processing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Default Processing Options</CardTitle>
                  <p className="text-sm text-gray-600">
                    These settings will be applied to all new document uploads
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="defaultProcessingOptions.detailLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Detail Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="comprehensive">Comprehensive</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How detailed should the analysis be by default
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultProcessingOptions.outputFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Output Format</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="structured">Structured</SelectItem>
                              <SelectItem value="narrative">Narrative</SelectItem>
                              <SelectItem value="bullet">Bullet Points</SelectItem>
                              <SelectItem value="detailed">Detailed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How should summaries be formatted
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Default Analysis Features</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="defaultProcessingOptions.extractCoverage"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Coverage Extraction</FormLabel>
                              <FormDescription className="text-sm">
                                Extract detailed coverage information
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="defaultProcessingOptions.generateExplanations"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Generate Explanations</FormLabel>
                              <FormDescription className="text-sm">
                                Include client-friendly explanations
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="defaultProcessingOptions.highlightRisks"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Highlight Risks</FormLabel>
                              <FormDescription className="text-sm">
                                Identify potential coverage gaps
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="defaultProcessingOptions.generateRecommendations"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Generate Recommendations</FormLabel>
                              <FormDescription className="text-sm">
                                Provide policy improvement suggestions
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Export Settings */}
            <TabsContent value="export" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export Preferences</CardTitle>
                  <p className="text-sm text-gray-600">
                    Default settings for PDF exports and document sharing
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="exportPreferences.defaultClientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Client Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Client name for exports" {...field} />
                          </FormControl>
                          <FormDescription>
                            Pre-fill client name field in export options
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="exportPreferences.defaultPolicyReference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Policy Reference</FormLabel>
                          <FormControl>
                            <Input placeholder="Policy reference prefix" {...field} />
                          </FormControl>
                          <FormDescription>
                            Pre-fill policy reference in export options
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Export Options</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="exportPreferences.includeBranding"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Include Branding</FormLabel>
                              <FormDescription className="text-sm">
                                Add Valley Trust Insurance logo and branding
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="exportPreferences.includeExplanations"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Include Explanations</FormLabel>
                              <FormDescription className="text-sm">
                                Add detailed explanations in exports
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interface Settings */}
            <TabsContent value="interface" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interface Preferences</CardTitle>
                  <p className="text-sm text-gray-600">
                    Customize the look and behavior of the application
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="uiPreferences.theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">
                              <div className="flex items-center space-x-2">
                                <Sun className="w-4 h-4" />
                                <span>Light</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="dark">
                              <div className="flex items-center space-x-2">
                                <Moon className="w-4 h-4" />
                                <span>Dark</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="system">
                              <div className="flex items-center space-x-2">
                                <Monitor className="w-4 h-4" />
                                <span>System</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose your preferred color theme
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base font-semibold">View Preferences</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="uiPreferences.compactView"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Compact View</FormLabel>
                              <FormDescription className="text-sm">
                                Use a more compact layout to fit more content
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="uiPreferences.showPreview"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Show Preview</FormLabel>
                              <FormDescription className="text-sm">
                                Display summary preview while processing
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <p className="text-sm text-gray-600">
                    Manage your account settings and security
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Valley Trust Insurance Agent</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      You have full access to all policy document processing features.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Usage Statistics</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">24</div>
                          <div className="text-sm text-gray-600">Documents Processed</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">156</div>
                          <div className="text-sm text-gray-600">Summaries Generated</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">89</div>
                          <div className="text-sm text-gray-600">PDFs Exported</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">12</div>
                          <div className="text-sm text-gray-600">This Month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={resetToDefaults}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateSettingsMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}