import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Globe, 
  MapPin,
  Save,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Upload,
  Signature,
  Shield,
  Award
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { queryClient } from "@/lib/queryClient";

const AgentProfileSchema = z.object({
  agentProfile: z.object({
    name: z.string().min(1, "Agent name is required"),
    title: z.string().min(1, "Job title is required"),
    phone: z.string().min(1, "Phone number is required"),
    email: z.string().email("Valid email is required"),
    license: z.string().min(1, "License number is required"),
    signature: z.string().optional(),
    firmName: z.string().min(1, "Firm name is required"),
    firmAddress: z.string().min(1, "Firm address is required"),
    firmPhone: z.string().min(1, "Firm phone is required"),
    firmWebsite: z.string().url("Valid website URL is required").optional().or(z.literal(""))
  }),
  uiPreferences: z.object({
    theme: z.enum(["light", "dark", "system"])
  })
});

type AgentProfileFormData = z.infer<typeof AgentProfileSchema>;

export function UserSettings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [signatureText, setSignatureText] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const form = useForm<AgentProfileFormData>({
    resolver: zodResolver(AgentProfileSchema),
    defaultValues: {
      agentProfile: {
        name: "",
        title: "",
        phone: "",
        email: "",
        license: "",
        signature: "",
        firmName: "Valley Trust Insurance",
        firmAddress: "",
        firmPhone: "",
        firmWebsite: ""
      },
      uiPreferences: {
        theme: "system"
      }
    }
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings && typeof settings === 'object') {
      form.reset(settings as AgentProfileFormData);
      if ('agentProfile' in settings && settings.agentProfile && typeof settings.agentProfile === 'object' && 'signature' in settings.agentProfile) {
        setSignatureText(settings.agentProfile.signature as string || "");
      }
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: AgentProfileFormData) => {
      console.log('Saving settings:', data);
      
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      console.log('Settings response status:', response.status);
      console.log('Settings response OK:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Settings save error response:', errorText);
        throw new Error(`Failed to update settings: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Settings save result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Settings saved successfully:', data);
      toast({
        title: "Settings saved",
        description: "Your agent profile and preferences have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      console.error('Settings save error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    form.setValue("uiPreferences.theme", newTheme);
  };

  const handleSignatureChange = (text: string) => {
    setSignatureText(text);
    form.setValue("agentProfile.signature", text);
  };

  const onSubmit = (data: AgentProfileFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const resetToDefaults = () => {
    form.reset({
      agentProfile: {
        name: "",
        title: "",
        phone: "",
        email: "",
        license: "",
        signature: "",
        firmName: "Valley Trust Insurance",
        firmAddress: "",
        firmPhone: "",
        firmWebsite: ""
      },
      uiPreferences: {
        theme: "system"
      }
    });
    setSignatureText("");
    setTheme("system");
    toast({
      title: "Settings reset",
      description: "All settings have been reset to default values.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent Settings</h1>
          <p className="text-muted-foreground">Configure your profile and appearance preferences</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
          <Shield className="w-4 h-4 mr-2" />
          Valley Trust Agent
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Agent Profile</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            {/* Agent Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    This information will appear on your PDF exports and client reports
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="agentProfile.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="John Smith" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agentProfile.title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Senior Insurance Agent" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agentProfile.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="john.smith@valleytrust.com" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agentProfile.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(555) 123-4567" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agentProfile.license"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="LIC123456789" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Firm Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="agentProfile.firmName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Firm Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agentProfile.firmPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Firm Phone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(555) 987-6543" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agentProfile.firmWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://valleytrust.com" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="agentProfile.firmAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Firm Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="123 Main Street&#10;Suite 100&#10;City, State 12345"
                            rows={3}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Signature className="w-5 h-5" />
                    <span>Digital Signature</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add a personalized signature to appear on your PDF exports
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="signature">Signature Text</Label>
                    <Textarea 
                      id="signature"
                      value={signatureText}
                      onChange={(e) => handleSignatureChange(e.target.value)}
                      placeholder="Best regards,&#10;John Smith&#10;Senior Insurance Agent"
                      rows={4}
                      className="font-serif"
                    />
                  </div>
                  
                  {signatureText && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <Label className="text-sm font-medium">Preview:</Label>
                      <div className="mt-2 font-serif text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {signatureText}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Monitor className="w-5 h-5" />
                    <span>Theme Settings</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred color theme
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      type="button"
                      variant={theme === "light" ? "default" : "outline"}
                      className="h-24 flex flex-col items-center justify-center space-y-2"
                      onClick={() => handleThemeChange("light")}
                    >
                      <Sun className="w-6 h-6" />
                      <span>Light</span>
                    </Button>

                    <Button
                      type="button"
                      variant={theme === "dark" ? "default" : "outline"}
                      className="h-24 flex flex-col items-center justify-center space-y-2"
                      onClick={() => handleThemeChange("dark")}
                    >
                      <Moon className="w-6 h-6" />
                      <span>Dark</span>
                    </Button>

                    <Button
                      type="button"
                      variant={theme === "system" ? "default" : "outline"}
                      className="h-24 flex flex-col items-center justify-center space-y-2"
                      onClick={() => handleThemeChange("system")}
                    >
                      <Monitor className="w-6 h-6" />
                      <span>System</span>
                    </Button>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Current theme:</strong> {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      {theme === "system" && " (automatically matches your device settings)"}
                    </p>
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