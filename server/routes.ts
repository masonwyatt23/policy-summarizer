import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import session from "express-session";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { storage } from "./storage";
import { documentProcessor } from "./services/documentProcessor";
import { pdfGenerator } from "./services/pdfGenerator";
import { xaiService } from "./services/xai";
import { insertPolicyDocumentSchema, PolicyDataSchema, insertAgentSchema } from "@shared/schema";

// Extend Express session to include agent
declare module 'express-session' {
  interface SessionData {
    agentId?: number;
    agentUsername?: string;
  }
}

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

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check if session exists and has agent ID
  if (!req.session || !req.session.agentId) {
    // Clear any invalid session
    if (req.session) {
      req.session.destroy(() => {});
    }
    
    return res.status(401).json({ error: "Authentication required" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Agent registration route
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertAgentSchema.parse(req.body);
      
      // Check if username already exists
      const existingAgent = await storage.getAgentByUsername(validatedData.username);
      if (existingAgent) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create agent
      const agent = await storage.createAgent({
        ...validatedData,
        password: hashedPassword
      });

      // Create default user settings with registration information populated
      await storage.createDefaultSettings(agent.id, {
        agentProfile: {
          name: agent.fullName,
          title: "",
          phone: "",
          email: agent.email,
          license: "",
          signature: "",
          firmName: "Valley Trust Insurance",
          firmAddress: "",
          firmPhone: "",
          firmWebsite: ""
        }
      });

      // Create session
      req.session.agentId = agent.id;
      req.session.agentUsername = agent.username;

      console.log(`✅ Registration successful for agent ${agent.id} (${agent.username})`);
      console.log(`🔑 Session ID: ${req.sessionID}`);
      
      // Ensure session is saved before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        
        console.log(`📝 Session saved for agent ${agent.id}`);
        
        res.status(201).json({ 
          success: true, 
          agent: { 
            id: agent.id, 
            username: agent.username, 
            fullName: agent.fullName,
            email: agent.email 
          } 
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Registration failed" });
    }
  });

  // Agent login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      // Find agent
      const agent = await storage.getAgentByUsername(username);
      if (!agent) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, agent.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create session
      req.session.agentId = agent.id;
      req.session.agentUsername = agent.username;

      // Ensure session is saved before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        
        res.json({ 
          success: true, 
          agent: { 
            id: agent.id, 
            username: agent.username, 
            fullName: agent.fullName,
            email: agent.email 
          } 
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Agent logout route - deployment-ready with better session cleanup
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      // Clear session cookie
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  // Get current agent route - deployment-ready with better session handling
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.session.agentId!);
      if (!agent) {
        // Clear invalid session
        req.session.destroy(() => {});
        return res.status(404).json({ error: "Agent not found" });
      }

      // Return same format as login endpoint for consistency
      res.json({ 
        id: agent.id, 
        username: agent.username, 
        fullName: agent.fullName,
        email: agent.email 
      });
    } catch (error) {
      console.error("Get agent error:", error);
      res.status(500).json({ error: "Failed to get agent" });
    }
  });

  // Upload and process policy document
  app.post("/api/documents/upload", requireAuth, upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Always use short summary for ultra-fast processing
      const processingOptions = { summaryLength: 'short' };

      // Create document record with agent association
      const documentData = {
        agentId: req.session.agentId!,
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

      // Start processing in background with options
      processDocumentAsync(document.id, req.file.buffer, req.file.originalname, processingOptions)
        .catch(error => {
          console.error(`❌ Background processing failed for document ${document.id}:`, error);
          // Update document status to failed
          storage.updatePolicyDocument(document.id, {
            processed: true,
            processingError: error.message
          }, req.session.agentId!);
        });

      res.json({ 
        documentId: document.id,
        message: "Document uploaded successfully and processing started" 
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Upload failed' });
    }
  });

  // Get document processing status
  app.get("/api/documents/:id/status", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agentId = req.session.agentId!;
      const document = await storage.getPolicyDocument(id, agentId);
      
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
      res.status(500).json({ error: error instanceof Error ? error.message : 'Status check failed' });
    }
  });

  // Get processed document data
  app.get("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agentId = req.session.agentId!;
      const document = await storage.getPolicyDocument(id, agentId);
      
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
        processingOptions: document.processingOptions,
      });
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Get document failed' });
    }
  });

  // Update document summary
  app.patch("/api/documents/:id/summary", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agentId = req.session.agentId!;
      const { summary } = req.body;
      
      if (!summary || typeof summary !== 'string') {
        return res.status(400).json({ error: "Summary is required and must be a string" });
      }
      
      const document = await storage.getPolicyDocument(id, agentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const updatedDocument = await storage.updatePolicyDocument(id, { summary }, agentId);
      if (!updatedDocument) {
        return res.status(500).json({ error: "Failed to update document summary" });
      }
      
      res.json({
        id: updatedDocument.id,
        originalName: updatedDocument.originalName,
        extractedData: updatedDocument.extractedData,
        summary: updatedDocument.summary,
        processed: updatedDocument.processed,
        uploadedAt: updatedDocument.uploadedAt,
        processingOptions: updatedDocument.processingOptions,
      });
    } catch (error) {
      console.error("Update summary error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Update summary failed' });
    }
  });

  // Generate PDF export
  app.post("/api/documents/:id/export", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agentId = req.session.agentId!;
      const document = await storage.getPolicyDocument(id, agentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!document.processed || !document.extractedData) {
        return res.status(400).json({ error: "Document not processed or no data available" });
      }

      // Get agent settings for agent profile information
      
      let settings = await storage.getUserSettings(agentId);
      if (!settings) {
        settings = await storage.createDefaultSettings(agentId);
      }
      
      console.log('[PDF Export] Settings retrieved:', !!settings);
      console.log('[PDF Export] Agent profile:', settings?.agentProfile ? 'found' : 'not found');
      if (settings?.agentProfile) {
        console.log('[PDF Export] Agent profile keys:', Object.keys(settings.agentProfile));
        console.log('[PDF Export] Has agentImage:', !!(settings.agentProfile as any).agentImage);
      }

      // Type-safe access to settings with proper casting
      const exportPrefs = settings.exportPreferences as { 
        defaultClientName?: string; 
        defaultPolicyReference?: string; 
        includeAgentSignature?: boolean; 
      };
      const agentProfile = settings.agentProfile as { 
        name?: string; 
        title?: string; 
        phone?: string; 
        email?: string; 
        license?: string; 
        signature?: string; 
        agentImage?: string; 
        firmName?: string; 
        firmAddress?: string; 
        firmPhone?: string; 
        firmWebsite?: string; 
      };
      
      const options: any = {
        clientName: req.body.clientName || exportPrefs?.defaultClientName || '',
        policyReference: req.body.policyReference || exportPrefs?.defaultPolicyReference || '',
        clientLogo: req.body.clientLogo || '',
        includeExplanations: req.body.includeExplanations !== false,
        includeTechnicalDetails: req.body.includeTechnicalDetails === true,
        includeBranding: req.body.includeBranding !== false,
        includeAgentSignature: true,
        agentProfile: agentProfile && agentProfile.name ? {
          name: agentProfile.name || '',
          title: agentProfile.title || '',
          phone: agentProfile.phone || '',
          email: agentProfile.email || '',
          license: agentProfile.license || '',
          signature: agentProfile.signature || '',
          agentImage: agentProfile.agentImage || '',
          firmName: agentProfile.firmName || '',
          firmAddress: agentProfile.firmAddress || '',
          firmPhone: agentProfile.firmPhone || '',
          firmWebsite: agentProfile.firmWebsite || '',
        } : undefined,
      };

      const policyData = document.extractedData as any;
      // Use custom summary if provided, otherwise use document summary
      const summary = req.body.customSummary || document.summary || '';

      // Debug log for agent image
      if (options.agentProfile?.agentImage) {
        console.log('[PDF Export] Agent image found, length:', options.agentProfile.agentImage.length);
      } else {
        console.log('[PDF Export] No agent image found');
      }

      const pdfBuffer = await pdfGenerator.generatePolicyPDF(policyData, summary, options);

      // Track PDF export
      const newCount = (document.pdfExportCount || 0) + 1;
      console.log(`[PDF Export] Document ${id}: incrementing count from ${document.pdfExportCount || 0} to ${newCount}`);
      
      await storage.updatePolicyDocument(id, {
        pdfExportCount: newCount,
        lastExportedAt: new Date(),
      }, agentId);
      
      console.log(`[PDF Export] Document ${id}: export count updated successfully`);

      // Create a simple, short filename
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD format
      const timeStr = new Date().toISOString().split('T')[1].substring(0, 5).replace(':', ''); // HHMM format
      
      const filename = `policy-summary-${dateStr}-${timeStr}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF export error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'PDF export failed' });
    }
  });

  // List all documents (agent-specific)
  app.get("/api/documents", requireAuth, async (req, res) => {
    try {
      const agentId = req.session.agentId!;
      const documents = await storage.listPolicyDocuments(agentId);
      
      // Prevent caching to ensure fresh data after exports
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json(documents.map(doc => ({
        id: doc.id,
        originalName: doc.originalName,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        processed: doc.processed,
        uploadedAt: doc.uploadedAt,
        hasError: !!doc.processingError,
        processingError: doc.processingError,
        pdfExportCount: doc.pdfExportCount || 0,
        lastExportedAt: doc.lastExportedAt,
        clientName: doc.clientName,
        policyReference: doc.policyReference,
        isFavorite: doc.isFavorite || false,
        tags: doc.tags || [],
      })));
    } catch (error) {
      console.error("List documents error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'List documents failed' });
    }
  });

  // Regenerate document summary with different options
  app.post("/api/documents/:id/regenerate", requireAuth, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const agentId = req.session.agentId!;
      const { summaryLength = 'detailed' } = req.body;
      
      console.log(`📋 Regenerating summary for document ${documentId} with length: ${summaryLength}`);
      
      // Get the existing document
      const document = await storage.getPolicyDocument(documentId, agentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      if (!document.extractedData) {
        return res.status(400).json({ error: "Document has no extracted data to regenerate summary from" });
      }
      
      // Process the document again with new options
      try {
        console.log(`🔄 Regenerating ${summaryLength} summary for document ${documentId}`);
        
        // Use the existing extracted data and generate new summary
        const existingData = typeof document.extractedData === 'string' 
          ? JSON.parse(document.extractedData) 
          : document.extractedData;
          
        const newSummary = await xaiService.generateEnhancedSummary(existingData, '', summaryLength);
        
        // Update the document with new summary and processing options
        const existingOptions = typeof document.processingOptions === 'string' 
          ? JSON.parse(document.processingOptions || '{}') 
          : (document.processingOptions || {});
          
        const updatedDocument = await storage.updatePolicyDocument(documentId, {
          summary: newSummary,
          processingOptions: JSON.stringify({ ...existingOptions, summaryLength })
        }, agentId);
        
        res.json({
          success: true,
          document: updatedDocument
        });
        
      } catch (processingError) {
        console.error("Error regenerating summary:", processingError);
        res.status(500).json({ error: "Failed to regenerate summary" });
      }
      
    } catch (error) {
      console.error("Error in regenerate endpoint:", error);
      res.status(500).json({ error: "Failed to regenerate document summary" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agentId = req.session.agentId!;
      const deleted = await storage.deletePolicyDocument(id, agentId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Document not found or access denied" });
      }

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Delete document failed' });
    }
  });

  // Get summary history for a document
  app.get("/api/documents/:id/summary-history", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const history = await storage.getSummaryHistory(documentId);
      
      res.json(history.map(h => ({
        id: h.id,
        documentId: h.documentId,
        versionNumber: h.version,
        summary: h.summary,
        generatedAt: h.createdAt,
        isActive: h.isActive,
        generatedBy: 'xAI Analysis',
        processingOptions: h.processingOptions
      })));
    } catch (error) {
      console.error("Get summary history error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Get summary history failed' });
    }
  });

  // Set active summary version
  app.post("/api/documents/:id/summary-history/:versionId/activate", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const versionId = parseInt(req.params.versionId);
      
      const success = await storage.setActiveSummary(documentId, versionId);
      
      if (!success) {
        return res.status(404).json({ error: "Summary version not found" });
      }

      res.json({ message: "Summary version activated successfully" });
    } catch (error) {
      console.error("Set active summary error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Set active summary failed' });
    }
  });

  // Delete summary version
  app.delete("/api/documents/:id/summary-history/:versionId", async (req, res) => {
    try {
      const versionId = parseInt(req.params.versionId);
      
      const deleted = await storage.deleteSummaryVersion(versionId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Summary version not found" });
      }

      res.json({ message: "Summary version deleted successfully" });
    } catch (error) {
      console.error("Delete summary version error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Delete summary version failed' });
    }
  });



  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      // Use session agent ID or default
      const agentId = req.session.agentId || 1;
      
      let settings = await storage.getUserSettings(agentId);
      if (!settings) {
        settings = await storage.createDefaultSettings(agentId);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Get settings failed' });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      // Use session agent ID or default
      const agentId = req.session.agentId || 1;
      
      const settingsData = req.body;
      const updatedSettings = await storage.updateUserSettings(agentId, settingsData);
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Update settings failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background document processing with deployment-ready timeout handling
async function processDocumentAsync(documentId: number, buffer: Buffer, filename: string, options?: any) {
  const startTime = Date.now();
  console.log(`🚀 Starting document processing for ID: ${documentId}`);
  console.log(`📋 Processing options passed to async function:`, options);
  console.log(`📋 Summary length in options:`, options?.summaryLength || 'not specified');
  console.log(`📋 Environment: NODE_ENV=${process.env.NODE_ENV}, REPLIT_DEPLOYMENT=${process.env.REPLIT_DEPLOYMENT}`);
  
  try {
    // Wrap document processing with timeout for deployment environments
    const processingPromise = documentProcessor.processDocument(buffer, filename, options);
    
    // Optimized timeout for Grok 4 (faster overall processing)
    // Check both NODE_ENV and Replit deployment indicators
    const isDeployed = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1';
    const timeoutMs = isDeployed ? 600000 : 420000; // 10 or 7 minutes
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Document processing timed out')), timeoutMs);
    });
    
    const result = await Promise.race([processingPromise, timeoutPromise]);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Document processing completed in ${processingTime}ms`);
    
    // Update the document
    await storage.updatePolicyDocument(documentId, {
      processed: true,
      extractedData: result.policyData as any,
      summary: result.summary,
      processingError: null,
      processingOptions: JSON.stringify(options || {}),
    });

    // Create summary history entry
    if (result.summary) {
      await storage.createSummaryVersion({
        documentId,
        summary: result.summary,
        version: 1, // First version
        isActive: true,
        processingOptions: options || {}
      });
    }
    
    console.log(`📊 Document ${documentId} processing completed successfully`);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Processing error for document ${documentId} after ${processingTime}ms:`, error);
    
    // Provide more specific error messages for deployment troubleshooting
    let errorMessage = 'Processing failed';
    if (error.message.includes('timeout')) {
      errorMessage = 'Document processing timed out. This usually happens with very large documents (over 50 pages). Please try splitting the document into smaller sections or contact support.';
    } else if (error.message.includes('API') || error.message.includes('fetch')) {
      errorMessage = 'External AI service temporarily unavailable. Please wait a few minutes and try again.';
    } else if (error.message.includes('extract')) {
      errorMessage = 'Unable to extract text from document. Please ensure the PDF contains readable text (not just images).';
    } else if (error.message.includes('xAI')) {
      errorMessage = error.message; // Pass through xAI-specific error messages
    } else {
      errorMessage = error instanceof Error ? error.message : 'Processing failed';
    }
    
    await storage.updatePolicyDocument(documentId, {
      processed: true,
      processingError: errorMessage,
    });
  }
}
