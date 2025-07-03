import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProcessedDocument, api } from '@/lib/api';

interface SummaryEditorProps {
  document: ProcessedDocument | null;
  onSummaryUpdate: (updatedSummary: string) => void;
  isLoading: boolean;
}

export function SummaryEditor({ document, onSummaryUpdate, isLoading }: SummaryEditorProps) {
  const [editedSummary, setEditedSummary] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for saving summary changes
  const saveSummaryMutation = useMutation({
    mutationFn: async (summary: string) => {
      if (!document?.id) {
        throw new Error('No document ID available for saving');
      }
      
      console.log('Saving summary for document ID:', document.id);
      console.log('Summary length:', summary.length);
      
      return api.updateDocumentSummary(document.id, summary);
    },
    onSuccess: (updatedDocument) => {
      console.log('Summary saved successfully:', updatedDocument.id);
      
      // Update the query cache with the new document data
      queryClient.setQueryData([`/api/documents/${document?.id}`], updatedDocument);
      // Invalidate the query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document?.id}`] });
      
      setHasChanges(false);
      toast({
        title: "Summary Saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Save error:', error);
      
      let errorMessage = "Failed to save summary changes";
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = "Document not found. Please reload the page and try again.";
        } else if (error.message.includes('400')) {
          errorMessage = "Invalid summary data. Please check your content and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update edited summary when document changes
  useEffect(() => {
    if (document?.summary) {
      setEditedSummary(document.summary);
      setHasChanges(false);
    }
  }, [document?.summary]);

  const handleSummaryChange = (value: string) => {
    setEditedSummary(value);
    setHasChanges(value !== document?.summary);
    // Update preview in real-time
    onSummaryUpdate(value);
  };

  const handleSave = () => {
    if (!document?.id) {
      toast({
        title: "Save Failed",
        description: "No document selected to save changes to.",
        variant: "destructive",
      });
      return;
    }
    
    if (!editedSummary.trim()) {
      toast({
        title: "Save Failed", 
        description: "Summary cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    if (!hasChanges) {
      toast({
        title: "No Changes",
        description: "No changes to save.",
      });
      return;
    }
    
    saveSummaryMutation.mutate(editedSummary);
  };

  const handleReset = () => {
    if (document?.summary) {
      setEditedSummary(document.summary);
      setHasChanges(false);
      // Reset the preview to show the original summary
      onSummaryUpdate('');
      toast({
        title: "Changes Reverted",
        description: "Summary has been reset to the original version.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-5/6 mb-4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!document?.summary) {
    return (
      <Card className="h-full">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-muted-foreground mb-4">Edit Summary</h2>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No summary available to edit.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload and process a document to generate a summary.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Edit Summary</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || !document?.id || saveSummaryMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveSummaryMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Summary Content
            </label>
            <Textarea
              value={editedSummary}
              onChange={(e) => handleSummaryChange(e.target.value)}
              placeholder="Edit the policy summary here..."
              className="min-h-[400px] font-mono text-sm"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Tips for editing:</strong>
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use [subheader] format to create section headings</li>
              <li>Keep paragraphs substantial (80-120 words each)</li>
              <li>Maintain professional, client-friendly language</li>
              <li>Include specific coverage amounts and limits</li>
              <li>End with Valley Trust contact information</li>
            </ul>
          </div>

          {hasChanges && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                You have unsaved changes. Remember to save before exporting to PDF.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}