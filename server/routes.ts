import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { documentProcessor } from "./services/documentProcessor";
import { pdfGenerator } from "./services/pdfGenerator";
import { insertPolicyDocumentSchema, PolicyDataSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload and process policy document
  app.post("/api/documents/upload", upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Create document record
      const documentData = {
        filename: `${Date.now()}-${req.file.originalname}`,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        processed: false,
        extractedData: null,
        summary: null,
        processingError: null,
      };

      const document = await storage.createPolicyDocument(documentData);

      // Start processing in background
      processDocumentAsync(document.id, req.file.buffer, req.file.originalname);

      res.json({ 
        documentId: document.id,
        message: "Document uploaded successfully and processing started" 
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get document processing status
  app.get("/api/documents/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getPolicyDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json({
        id: document.id,
        originalName: document.originalName,
        processed: document.processed,
        processingError: document.processingError,
        hasData: !!document.extractedData,
        hasSummary: !!document.summary,
      });
    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get processed document data
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getPolicyDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!document.processed) {
        return res.status(202).json({ 
          message: "Document is still being processed",
          processed: false 
        });
      }

      if (document.processingError) {
        return res.status(422).json({ 
          error: document.processingError,
          processed: true 
        });
      }

      res.json({
        id: document.id,
        originalName: document.originalName,
        extractedData: document.extractedData,
        summary: document.summary,
        processed: document.processed,
        uploadedAt: document.uploadedAt,
      });
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate PDF export
  app.post("/api/documents/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getPolicyDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!document.processed || !document.extractedData) {
        return res.status(400).json({ error: "Document not processed or no data available" });
      }

      const options = {
        clientName: req.body.clientName || '',
        policyReference: req.body.policyReference || '',
        includeExplanations: req.body.includeExplanations !== false,
        includeTechnicalDetails: req.body.includeTechnicalDetails === true,
        includeBranding: req.body.includeBranding !== false,
      };

      const policyData = document.extractedData as any;
      const summary = document.summary || '';

      const pdfBuffer = await pdfGenerator.generatePolicyPDF(policyData, summary, options);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="policy-summary-${document.originalName}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF export error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // List all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.listPolicyDocuments();
      res.json(documents.map(doc => ({
        id: doc.id,
        originalName: doc.originalName,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        processed: doc.processed,
        uploadedAt: doc.uploadedAt,
        hasError: !!doc.processingError,
      })));
    } catch (error) {
      console.error("List documents error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePolicyDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background document processing
async function processDocumentAsync(documentId: number, buffer: Buffer, filename: string) {
  try {
    const result = await documentProcessor.processDocument(buffer, filename);
    
    await storage.updatePolicyDocument(documentId, {
      processed: true,
      extractedData: result.policyData as any,
      summary: result.summary,
      processingError: null,
    });
  } catch (error) {
    console.error(`Processing error for document ${documentId}:`, error);
    
    await storage.updatePolicyDocument(documentId, {
      processed: true,
      processingError: error.message,
    });
  }
}
