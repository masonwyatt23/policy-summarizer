import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const policyDocuments = pgTable("policy_documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processed: boolean("processed").default(false).notNull(),
  extractedData: jsonb("extracted_data"),
  summary: text("summary"),
  processingError: text("processing_error"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPolicyDocumentSchema = createInsertSchema(policyDocuments).omit({
  id: true,
  uploadedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PolicyDocument = typeof policyDocuments.$inferSelect;
export type InsertPolicyDocument = z.infer<typeof insertPolicyDocumentSchema>;

// Policy data structures
export const PolicyDataSchema = z.object({
  policyType: z.string(),
  insurer: z.string(),
  coverageDetails: z.array(z.object({
    type: z.string(),
    limit: z.string(),
    deductible: z.string().optional(),
  })),
  eligibility: z.object({
    ageLimit: z.string().optional(),
    maxDuration: z.string().optional(),
    restrictions: z.array(z.string()).optional(),
  }),
  exclusions: z.array(z.string()),
  importantContacts: z.object({
    insurer: z.string().optional(),
    administrator: z.string().optional(),
    emergencyLine: z.string().optional(),
  }),
  keyBenefits: z.array(z.string()),
  whyItMatters: z.string(),
});

export type PolicyData = z.infer<typeof PolicyDataSchema>;
