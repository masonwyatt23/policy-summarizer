import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  FileText, 
  Search, 
  Star, 
  Calendar, 
  Tag, 
  Filter, 
  MoreVertical,
  Heart,
  Trash2,
  Eye,
  Download,
  History,
  Check,
  X,
  CheckSquare,
  Square,
  ExternalLink,
  FileDown,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryHistoryDialog } from "./SummaryHistoryDialog";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DocumentListItem {
  id: number;
  originalName: string;
  fileSize: number;
  fileType: string;
  processed: boolean;
  uploadedAt: string;
  lastViewedAt?: string;
  isFavorite: boolean;
  tags: string[];
  processingError?: string | null;
  clientName?: string;
  policyReference?: string;
  pdfExportCount?: number;
  lastExportedAt?: string;
}

export function DocumentDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [filterBy, setFilterBy] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedDocumentForHistory, setSelectedDocumentForHistory] = useState<number | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: documents = [], isLoading } = useQuery<DocumentListItem[]>({
    queryKey: ['/api/documents'],
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/documents/${id}/favorite`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      // Delete documents one by one since we don't have a batch endpoint
      const promises = ids.map(id => 
        apiRequest('DELETE', `/api/documents/${id}`)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      setSelectedDocuments([]);
      setIsSelectionMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });

  // Selection helper functions
  const toggleDocumentSelection = (id: number) => {
    setSelectedDocuments(prev => 
      prev.includes(id) 
        ? prev.filter(docId => docId !== id)
        : [...prev, id]
    );
  };

  const selectAllDocuments = () => {
    const allIds = filteredDocuments.map((doc: DocumentListItem) => doc.id);
    setSelectedDocuments(allIds);
  };

  const deselectAllDocuments = () => {
    setSelectedDocuments([]);
  };

  const handleBatchDelete = () => {
    if (selectedDocuments.length > 0 && confirm(`Are you sure you want to delete ${selectedDocuments.length} document(s)?`)) {
      batchDeleteMutation.mutate(selectedDocuments);
    }
  };

  const updateTagsMutation = useMutation({
    mutationFn: async ({ id, tags }: { id: number; tags: string[] }) => {
      return apiRequest('PATCH', `/api/documents/${id}/tags`, { tags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });



  // Handler functions
  const handleViewSummary = (documentId: number) => {
    // Add loading feedback
    toast({
      title: "Loading Summary",
      description: "Opening document summary...",
    });
    setLocation(`/summary/${documentId}`);
  };

  const handleViewHistory = (documentId: number) => {
    setSelectedDocumentForHistory(documentId);
    setHistoryDialogOpen(true);
  };

  const toggleCardExpansion = (documentId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const filteredDocuments = documents.filter((doc: DocumentListItem) => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.policyReference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterBy === "all" || 
                         (filterBy === "processed" && doc.processed) ||
                         (filterBy === "unprocessed" && !doc.processed);
    
    return matchesSearch && matchesFilter;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.originalName.localeCompare(b.originalName);
      case "size":
        return b.fileSize - a.fileSize;
      case "lastViewed":
        return new Date(b.lastViewedAt || 0).getTime() - new Date(a.lastViewedAt || 0).getTime();
      default:
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const DocumentCard = ({ document }: { document: DocumentListItem }) => {
    const isExpanded = expandedCards.has(document.id);
    
    return (
      <Card className={`transition-all duration-300 border-l-4 ${
        document.processed 
          ? document.processingError 
            ? 'border-l-red-500' 
            : 'border-l-green-500'
          : 'border-l-yellow-500'
      } ${isSelectionMode && selectedDocuments.includes(document.id) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'bg-card hover:bg-muted/50'}`}>
        
        {/* Clickable Header */}
        <CardHeader 
          className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => toggleCardExpansion(document.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {isSelectionMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDocumentSelection(document.id);
                  }}
                >
                  {selectedDocuments.includes(document.id) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              )}
              
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <FileText className={`w-5 h-5 flex-shrink-0 ${
                  document.processed 
                    ? document.processingError 
                      ? 'text-red-500' 
                      : 'text-green-500'
                    : 'text-yellow-500'
                }`} />
                
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-medium truncate text-foreground" title={document.originalName}>
                    {document.originalName}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={document.processed ? "default" : "secondary"} 
                      className={`text-xs ${
                        document.processed 
                          ? document.processingError 
                            ? 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' 
                            : 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
                          : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                      }`}>
                      {document.processed 
                        ? document.processingError 
                          ? "Error" 
                          : "Ready"
                        : "Processing"}
                    </Badge>
                    {document.isFavorite && (
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Compact info when collapsed */}
              {!isExpanded && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>•</span>
                  <span>{document.fileType.toUpperCase()}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-muted"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleViewSummary(document.id)}
                    disabled={!document.processed}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Summary
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleViewHistory(document.id)}
                    disabled={!document.processed}
                  >
                    <History className="w-4 h-4 mr-2" />
                    Version History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => toggleFavoriteMutation.mutate(document.id)}
                    disabled={toggleFavoriteMutation.isPending}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${document.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    {document.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => deleteDocumentMutation.mutate(document.id)}
                    disabled={deleteDocumentMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Expand/Collapse Chevron */}
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                isExpanded ? 'transform rotate-180' : ''
              }`} />
            </div>
          </div>
        </CardHeader>

        {/* Collapsible Content */}
        {isExpanded && (
          <CardContent className="p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{formatFileSize(document.fileSize)}</span>
                <span>{document.fileType.toUpperCase()}</span>
              </div>
              
              {document.clientName && (
                <div className="text-sm">
                  <span className="font-medium">Client:</span> {document.clientName}
                </div>
              )}
              
              {document.policyReference && (
                <div className="text-sm">
                  <span className="font-medium">Policy:</span> {document.policyReference}
                </div>
              )}
              
              {document.pdfExportCount && document.pdfExportCount > 0 && (
                <div className="text-sm">
                  <span className="font-medium">PDF Exports:</span> {document.pdfExportCount}
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Badge variant={document.processed ? "default" : "secondary"} className={document.processed ? "bg-green-100 text-green-800" : ""}>
                  {document.processed ? "Processed" : "Processing..."}
                </Badge>
                {document.isFavorite && (
                  <Badge variant="outline">
                    <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                    Favorite
                  </Badge>
                )}
                {document.processingError && (
                  <Badge variant="destructive">Error</Badge>
                )}
              </div>
              
              {document.tags && document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {document.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="w-2 h-2 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                <div>Uploaded: {formatDate(document.uploadedAt)}</div>
                {document.lastViewedAt && (
                  <div>Last viewed: {formatDate(document.lastViewedAt)}</div>
                )}
                {document.lastExportedAt && (
                  <div>Last exported: {formatDate(document.lastExportedAt)}</div>
                )}
              </div>

              {/* Quick Action Buttons */}
              {document.processed && !document.processingError && (
                <div className="pt-3 border-t border-border space-y-2">
                  {/* Primary Action - View Summary */}
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full h-8 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewSummary(document.id);
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1.5" />
                    View Summary
                  </Button>
                  
                  {/* Secondary Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewHistory(document.id);
                      }}
                    >
                      <History className="w-3 h-3 mr-1" />
                      History
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Dashboard</h1>
          <p className="text-muted-foreground">Manage your policy documents and summaries</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search documents, clients, or policy references..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Documents</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="unprocessed">Unprocessed</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uploadedAt">Upload Date</SelectItem>
            <SelectItem value="lastViewed">Last Viewed</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="size">File Size</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Batch Selection Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (!isSelectionMode) {
                setSelectedDocuments([]);
              }
            }}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            {isSelectionMode ? 'Exit Selection' : 'Select'}
          </Button>
        </div>
      </div>

      {/* Batch Action Bar */}
      {isSelectionMode && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectedDocuments.length === filteredDocuments.length ? deselectAllDocuments : selectAllDocuments}
              >
                {selectedDocuments.length === filteredDocuments.length ? (
                  <Square className="w-4 h-4 mr-2" />
                ) : (
                  <CheckSquare className="w-4 h-4 mr-2" />
                )}
                {selectedDocuments.length === filteredDocuments.length ? 'Deselect All' : 'Select All'}
              </Button>
              
              <span className="text-sm text-muted-foreground">
                {selectedDocuments.length} of {filteredDocuments.length} selected
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={selectedDocuments.length === 0 || batchDeleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {batchDeleteMutation.isPending ? 'Deleting...' : `Delete ${selectedDocuments.length}`}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedDocuments([]);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processed</p>
                <p className="text-2xl font-bold">
                  {documents.filter((d: DocumentListItem) => d.processed).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PDF Exports</p>
                <p className="text-2xl font-bold">
                  {documents.reduce((total: number, d: DocumentListItem) => total + (d.pdfExportCount || 0), 0)}
                </p>
              </div>
              <Download className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Loading documents...</p>
          </div>
        ) : sortedDocuments.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery || filterBy !== "all" 
                ? "No documents match your search criteria" 
                : "No documents uploaded yet"}
            </p>
          </div>
        ) : (
          sortedDocuments.map((document: DocumentListItem) => (
            <DocumentCard key={document.id} document={document} />
          ))
        )}
      </div>

      {/* Summary History Dialog */}
      <SummaryHistoryDialog
        documentId={selectedDocumentForHistory}
        isOpen={historyDialogOpen}
        onClose={() => {
          setHistoryDialogOpen(false);
          setSelectedDocumentForHistory(null);
        }}
      />
    </div>
  );
}