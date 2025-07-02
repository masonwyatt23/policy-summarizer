import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  Star, 
  Trash2, 
  Eye, 
  CheckCircle,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';

interface SummaryVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  summary: string;
  generatedAt: string;
  isActive: boolean;
  generatedBy?: string;
  processingOptions?: any;
}

interface SummaryHistoryDialogProps {
  documentId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SummaryHistoryDialog({ documentId, isOpen, onClose }: SummaryHistoryDialogProps) {
  const [selectedVersion, setSelectedVersion] = useState<SummaryVersion | null>(null);
  const queryClient = useQueryClient();

  const { data: summaryHistory, isLoading } = useQuery<SummaryVersion[]>({
    queryKey: [`/api/documents/${documentId}/summary-history`],
    enabled: !!documentId && isOpen,
  });

  const setActiveMutation = useMutation({
    mutationFn: async (versionId: number) => {
      const response = await fetch(`/api/documents/${documentId}/summary-history/${versionId}/activate`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to set active summary');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/summary-history`] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}`] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (versionId: number) => {
      const response = await fetch(`/api/documents/${documentId}/summary-history/${versionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete summary version');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/summary-history`] });
      setSelectedVersion(null);
    },
  });

  if (!documentId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Summary History</span>
          </DialogTitle>
          <DialogDescription>
            View and manage different versions of this document's summary
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* History List */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Version History</h3>
            
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {summaryHistory?.map((version) => (
                    <Card 
                      key={version.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id 
                          ? 'ring-2 ring-valley-primary bg-valley-primary/5' 
                          : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={version.isActive ? "default" : "secondary"}>
                              Version {version.versionNumber}
                            </Badge>
                            {version.isActive && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(version.generatedAt).toLocaleDateString()}</span>
                            </div>
                            {version.generatedBy && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{version.generatedBy}</span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-sm text-slate-700 mt-2 line-clamp-2">
                            {version.summary.substring(0, 120)}...
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {summaryHistory?.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No summary history available</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Version Details */}
          <div className="space-y-4">
            {selectedVersion ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900">
                    Version {selectedVersion.versionNumber} Details
                  </h3>
                  <div className="flex space-x-2">
                    {!selectedVersion.isActive && (
                      <Button
                        size="sm"
                        onClick={() => setActiveMutation.mutate(selectedVersion.id)}
                        disabled={setActiveMutation.isPending}
                        className="valley-primary valley-primary-hover"
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Make Active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(selectedVersion.id)}
                      disabled={deleteMutation.isPending || selectedVersion.isActive}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                <Card className="p-4">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Generated:</span>
                      <span className="font-medium">
                        {new Date(selectedVersion.generatedAt).toLocaleString()}
                      </span>
                    </div>
                    {selectedVersion.generatedBy && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Generated by:</span>
                        <span className="font-medium">{selectedVersion.generatedBy}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Status:</span>
                      <Badge variant={selectedVersion.isActive ? "default" : "secondary"}>
                        {selectedVersion.isActive ? 'Active Version' : 'Archived'}
                      </Badge>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span className="font-medium text-slate-900">Summary Content</span>
                    </div>
                    <ScrollArea className="h-64">
                      <div className="prose prose-sm max-w-none">
                        <div className="text-slate-700 leading-relaxed space-y-3">
                          {selectedVersion.summary.split('\n').map((paragraph, index) => {
                            if (paragraph.trim() === '') {
                              return <div key={index} className="h-2"></div>;
                            }
                            
                            if (paragraph.includes('**')) {
                              const parts = paragraph.split('**');
                              return (
                                <div key={index}>
                                  {parts.map((part, partIndex) => {
                                    if (partIndex % 2 === 1) {
                                      return (
                                        <strong key={partIndex} className="font-semibold text-slate-900">
                                          {part}
                                        </strong>
                                      );
                                    } else if (part.trim()) {
                                      return <span key={partIndex}>{part}</span>;
                                    }
                                    return null;
                                  })}
                                </div>
                              );
                            }
                            
                            return (
                              <p key={index} className="text-sm">
                                {paragraph}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </Card>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Eye className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Select a version to view details</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}