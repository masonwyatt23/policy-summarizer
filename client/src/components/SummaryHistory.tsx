import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  History, 
  Calendar, 
  CheckCircle, 
  Circle,
  Eye,
  Download,
  Trash2,
  Settings,
  ArrowRight,
  Clock,
  FileText,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";

interface SummaryVersion {
  id: number;
  documentId: number;
  version: number;
  summary: string;
  processingOptions: Record<string, any>;
  createdAt: string;
  isActive: boolean;
}

interface SummaryHistoryProps {
  documentId: number;
  documentName: string;
}

export function SummaryHistory({ documentId, documentName }: SummaryHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<SummaryVersion | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['/api/documents', documentId, 'history'],
  });

  const setActiveVersionMutation = useMutation({
    mutationFn: async (versionId: number) => {
      return apiRequest(`/api/documents/${documentId}/history/${versionId}/activate`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId, 'history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId] });
    },
  });

  const deleteVersionMutation = useMutation({
    mutationFn: async (versionId: number) => {
      return apiRequest(`/api/documents/${documentId}/history/${versionId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId, 'history'] });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getProcessingOptionsText = (options: Record<string, any>) => {
    const enabledOptions = [];
    if (options.extractCoverage) enabledOptions.push("Coverage");
    if (options.generateExplanations) enabledOptions.push("Explanations");
    if (options.highlightRisks) enabledOptions.push("Risk Analysis");
    if (options.includeScenarios) enabledOptions.push("Scenarios");
    if (options.generateRecommendations) enabledOptions.push("Recommendations");
    
    return enabledOptions.length > 0 ? enabledOptions.join(", ") : "Standard processing";
  };

  const getDetailLevelBadge = (detailLevel: string) => {
    const colors = {
      basic: "bg-gray-100 text-gray-800",
      standard: "bg-blue-100 text-blue-800",
      comprehensive: "bg-green-100 text-green-800",
      expert: "bg-purple-100 text-purple-800"
    };
    
    return (
      <Badge className={colors[detailLevel as keyof typeof colors] || colors.standard}>
        {detailLevel || "Standard"}
      </Badge>
    );
  };

  const getSummaryPreview = (summary: string, maxLength: number = 200) => {
    if (summary.length <= maxLength) return summary;
    return summary.substring(0, maxLength) + "...";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <History className="w-5 h-5" />
            <span>Summary History</span>
          </h2>
          <p className="text-sm text-gray-600">{documentName}</p>
        </div>
        <Badge variant="outline">
          {versions.length} {versions.length === 1 ? 'version' : 'versions'}
        </Badge>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Loading version history...</p>
            </CardContent>
          </Card>
        ) : versions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No summary versions found</p>
            </CardContent>
          </Card>
        ) : (
          versions.map((version: SummaryVersion, index: number) => {
            const formatted = formatDate(version.createdAt);
            const isActive = version.isActive;
            
            return (
              <Card key={version.id} className={`relative ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -left-2 top-4">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Circle className={`w-2 h-2 ${isActive ? 'fill-blue-500 text-blue-500' : 'fill-gray-300 text-gray-300'}`} />
                        <CardTitle className="text-base">
                          Version {version.version}
                          {isActive && (
                            <Badge variant="default" className="ml-2">
                              Active
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                      {getDetailLevelBadge(version.processingOptions?.detailLevel)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm text-gray-500">
                        <div>{formatted.date}</div>
                        <div>{formatted.time}</div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-1">
                        <Dialog 
                          open={isPreviewOpen && selectedVersion?.id === version.id}
                          onOpenChange={(open) => {
                            setIsPreviewOpen(open);
                            if (!open) setSelectedVersion(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedVersion(version)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>
                                Summary Preview - Version {version.version}
                              </DialogTitle>
                              <DialogDescription>
                                Created on {formatted.date} at {formatted.time}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
                              <div className="whitespace-pre-wrap">{version.summary}</div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                        
                        {!isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveVersionMutation.mutate(version.id)}
                            disabled={setActiveVersionMutation.isPending}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        {!isActive && versions.length > 1 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Version</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete version {version.version}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteVersionMutation.mutate(version.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Processing Options Summary */}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Processing:</span> {getProcessingOptionsText(version.processingOptions)}
                    </div>
                    
                    {/* Summary Preview */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {getSummaryPreview(version.summary)}
                      </p>
                      {version.summary.length > 200 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-blue-600"
                          onClick={() => {
                            setSelectedVersion(version);
                            setIsPreviewOpen(true);
                          }}
                        >
                          Read more <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Processing Options Details */}
                    {version.processingOptions?.focusAreas && (
                      <div className="flex flex-wrap gap-1">
                        {version.processingOptions.focusAreas.map((area: string) => (
                          <Badge key={area} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                
                {/* Connection line to next version */}
                {index < versions.length - 1 && (
                  <div className="absolute left-2 -bottom-4 w-0.5 h-4 bg-gray-200"></div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Statistics */}
      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{versions.length}</div>
                <div className="text-sm text-gray-600">Total Versions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {versions.filter((v: SummaryVersion) => v.processingOptions?.detailLevel === 'comprehensive').length}
                </div>
                <div className="text-sm text-gray-600">Comprehensive</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {versions.filter((v: SummaryVersion) => v.processingOptions?.detailLevel === 'expert').length}
                </div>
                <div className="text-sm text-gray-600">Expert Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {versions.filter((v: SummaryVersion) => v.processingOptions?.generateRecommendations).length}
                </div>
                <div className="text-sm text-gray-600">With Recommendations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}