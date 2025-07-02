import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const policyDocuments = pgTable("policy_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processed: boolean("processed").default(false).notNull(),
  extractedData: jsonb("extracted_data"),
  summary: text("summary"),
  processingError: text("processing_error"),
  lastViewedAt: timestamp("last_viewed_at"),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  tags: text("tags").array().default([]).notNull(),
  processingOptions: jsonb("processing_options").default({}).notNull(),
  clientName: text("client_name"),
  policyReference: text("policy_reference"),
});

export const summaryHistory = pgTable("summary_history", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => policyDocuments.id).notNull(),
  version: integer("version").notNull(),
  summary: text("summary").notNull(),
  processingOptions: jsonb("processing_options").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(false).notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  defaultProcessingOptions: jsonb("default_processing_options").default({
    extractCoverage: true,
    generateExplanations: true,
    includeImportance: true,
    detailLevel: "comprehensive",
    focusAreas: ["coverage", "exclusions", "eligibility"],
    outputFormat: "structured"
  }).notNull(),
  // Agent Profile Information
  agentProfile: jsonb("agent_profile").default({
    name: "",
    title: "",
    phone: "",
    email: "",
    license: "",
    signature: "", // Base64 encoded image or text signature
    firmName: "Valley Trust Insurance",
    firmAddress: "",
    firmPhone: "",
    firmWebsite: ""
  }).notNull(),
  exportPreferences: jsonb("export_preferences").default({
    includeBranding: true,
    includeExplanations: true,
    includeTechnicalDetails: false,
    includeAgentSignature: true,
    defaultClientName: "",
    defaultPolicyReference: ""
  }).notNull(),
  uiPreferences: jsonb("ui_preferences").default({
    theme: "system"
  }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  documents: many(policyDocuments),
  settings: one(userSettings),
}));

export const policyDocumentsRelations = relations(policyDocuments, ({ one, many }) => ({
  user: one(users, {
    fields: [policyDocuments.userId],
    references: [users.id],
  }),
  summaryVersions: many(summaryHistory),
}));

export const summaryHistoryRelations = relations(summaryHistory, ({ one }) => ({
  document: one(policyDocuments, {
    fields: [summaryHistory.documentId],
    references: [policyDocuments.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPolicyDocumentSchema = createInsertSchema(policyDocuments).omit({
  id: true,
  uploadedAt: true,
  lastViewedAt: true,
});

export const insertSummaryHistorySchema = createInsertSchema(summaryHistory).omit({
  id: true,
  createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PolicyDocument = typeof policyDocuments.$inferSelect;
export type InsertPolicyDocument = z.infer<typeof insertPolicyDocumentSchema>;
export type SummaryHistory = typeof summaryHistory.$inferSelect;
export type InsertSummaryHistory = z.infer<typeof insertSummaryHistorySchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// Processing Options Schema
export const ProcessingOptionsSchema = z.object({
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

export type ProcessingOptions = z.infer<typeof ProcessingOptionsSchema>;

// Enhanced Policy data structures
export const PolicyDataSchema = z.object({
  policyType: z.string(),
  insurer: z.string(),
  policyNumber: z.string().optional(),
  policyPeriod: z.string().optional(),
  insuredName: z.string().optional(),
  effectiveDate: z.string().optional(),
  expirationDate: z.string().optional(),
  premiumAmount: z.string().optional(),
  
  // Document verification fields
  documentInconsistencies: z.array(z.object({
    field: z.string(),
    variations: z.array(z.string()),
    recommendation: z.string(),
  })).optional(),
  
  documentAccuracyNotes: z.string().optional(),
  unverifiedInformation: z.array(z.string()).optional(),
  missingInformation: z.array(z.string()).optional(),
  recommendedVerifications: z.array(z.string()).optional(),
  coverageDetails: z.array(z.object({
    type: z.string(),
    limit: z.string(),
    deductible: z.string().optional(),
    description: z.string().optional(),
    waitingPeriod: z.string().optional(),
  })),
  
  // Verification-specific coverage details
  verifiedCoverageDetails: z.array(z.object({
    type: z.string(),
    formCode: z.string().optional(),
    limit: z.string(),
    deductible: z.string().optional(),
  })).optional(),
  eligibility: z.object({
    ageLimit: z.string().optional(),
    maxDuration: z.string().optional(),
    restrictions: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
  }),
  exclusions: z.array(z.object({
    category: z.string().optional(),
    description: z.string(),
    impact: z.string().optional(),
    formCode: z.string().optional(),
  })),
  importantContacts: z.array(z.object({
    type: z.string(),
    details: z.string(),
  })).optional(),
  keyBenefits: z.array(z.object({
    benefit: z.string(),
    description: z.string().optional(),
    importance: z.enum(["low", "medium", "high", "critical"]).optional(),
  })),
  claimsProcess: z.object({
    howToClaim: z.array(z.string()).optional(),
    requiredDocuments: z.array(z.string()).optional(),
    timeframes: z.array(z.string()).optional(),
  }).optional(),
  riskAssessment: z.object({
    highRiskFactors: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
    scenarios: z.array(z.object({
      situation: z.string(),
      coverage: z.string(),
      outcome: z.string(),
    })).optional(),
  }).optional(),
  whyItMatters: z.string(),
  clientRecommendations: z.array(z.string()).optional(),
});

export type PolicyData = z.infer<typeof PolicyDataSchema>;
