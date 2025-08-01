import { apiRequest } from "./queryClient";

export interface UploadResponse {
  documentId: number;
  message: string;
}

export interface DocumentStatus {
  id: number;
  originalName: string;
  processed: boolean;
  processingError?: string;
  hasData: boolean;
  hasSummary: boolean;
}

export interface ProcessedDocument {
  id: number;
  originalName: string;
  extractedData: any;
  summary: string;
  processed: boolean;
  uploadedAt: string;
  processingOptions?: any;
}

export interface DocumentListItem {
  id: number;
  originalName: string;
  fileSize: number;
  fileType: string;
  processed: boolean;
  uploadedAt: string;
  hasError: boolean;
  pdfExportCount?: number;
  lastExportedAt?: string;
  clientName?: string;
  policyReference?: string;
  isFavorite?: boolean;
  tags?: string[];
  lastViewedAt?: string;
  processingError?: string | null;
}

export interface ExportOptions {
  clientName?: string;
  policyReference?: string;
  includeExplanations?: boolean;
  includeTechnicalDetails?: boolean;
  includeBranding?: boolean;
  customSummary?: string;
}

interface UploadOptions {
  summaryLength?: 'short' | 'detailed';
}

export const api = {
  async uploadDocument(file: File, options?: UploadOptions): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('document', file);
    
    // Add processing options if provided
    if (options) {
      formData.append('options', JSON.stringify(options));
    }
    
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include', // Include session cookies
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
    
    return response.json();
  },

  async getDocumentStatus(id: number): Promise<DocumentStatus> {
    const response = await apiRequest('GET', `/api/documents/${id}/status`);
    return response.json();
  },

  async getDocument(id: number): Promise<ProcessedDocument> {
    const response = await apiRequest('GET', `/api/documents/${id}`);
    return response.json();
  },

  async exportPDF(id: number, options: ExportOptions): Promise<Blob> {
    const response = await fetch(`/api/documents/${id}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
      credentials: 'include', // Include session cookies
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Export failed');
    }
    
    return response.blob();
  },

  async listDocuments(): Promise<DocumentListItem[]> {
    const response = await apiRequest('GET', '/api/documents');
    return response.json();
  },

  async deleteDocument(id: number): Promise<void> {
    await apiRequest('DELETE', `/api/documents/${id}`);
  },

  async updateDocumentSummary(id: number, summary: string): Promise<ProcessedDocument> {
    const response = await apiRequest('PATCH', `/api/documents/${id}/summary`, {
      summary
    });
    return response.json();
  },

  async regenerateSummary(id: number, summaryLength: 'short' | 'detailed'): Promise<{ success: boolean; document: ProcessedDocument }> {
    const response = await apiRequest('POST', `/api/documents/${id}/regenerate`, {
      summaryLength
    });
    return response.json();
  },
};
