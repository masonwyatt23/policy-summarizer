import { 
  users, 
  policyDocuments, 
  summaryHistory, 
  userSettings,
  type User, 
  type InsertUser, 
  type PolicyDocument, 
  type InsertPolicyDocument,
  type SummaryHistory,
  type InsertSummaryHistory,
  type UserSettings,
  type InsertUserSettings
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Policy document methods
  createPolicyDocument(document: InsertPolicyDocument): Promise<PolicyDocument>;
  getPolicyDocument(id: number): Promise<PolicyDocument | undefined>;
  updatePolicyDocument(id: number, updates: Partial<PolicyDocument>): Promise<PolicyDocument | undefined>;
  listPolicyDocuments(userId?: number): Promise<PolicyDocument[]>;
  deletePolicyDocument(id: number): Promise<boolean>;
  toggleFavorite(id: number): Promise<PolicyDocument | undefined>;
  updateTags(id: number, tags: string[]): Promise<PolicyDocument | undefined>;
  searchDocuments(query: string, userId?: number): Promise<PolicyDocument[]>;
  
  // Summary history methods
  createSummaryVersion(summaryData: InsertSummaryHistory): Promise<SummaryHistory>;
  getSummaryHistory(documentId: number): Promise<SummaryHistory[]>;
  getActiveSummary(documentId: number): Promise<SummaryHistory | undefined>;
  setActiveSummary(documentId: number, versionId: number): Promise<boolean>;
  deleteSummaryVersion(versionId: number): Promise<boolean>;
  
  // Settings methods
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  updateUserSettings(userId: number, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  createDefaultSettings(userId: number): Promise<UserSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private policyDocuments: Map<number, PolicyDocument>;
  private currentUserId: number;
  private currentDocumentId: number;

  constructor() {
    this.users = new Map();
    this.policyDocuments = new Map();
    this.currentUserId = 1;
    this.currentDocumentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPolicyDocument(insertDocument: InsertPolicyDocument): Promise<PolicyDocument> {
    const id = this.currentDocumentId++;
    const document: PolicyDocument = {
      ...insertDocument,
      id,
      uploadedAt: new Date(),
      summary: insertDocument.summary || null,
      processed: insertDocument.processed || false,
      extractedData: insertDocument.extractedData || null,
      processingError: insertDocument.processingError || null,
      tags: insertDocument.tags || [],
      isFavorite: insertDocument.isFavorite || false,
      lastViewedAt: null,
      clientName: insertDocument.clientName || null,
      policyReference: insertDocument.policyReference || null,
    };
    this.policyDocuments.set(id, document);
    return document;
  }

  async getPolicyDocument(id: number): Promise<PolicyDocument | undefined> {
    return this.policyDocuments.get(id);
  }

  async updatePolicyDocument(id: number, updates: Partial<PolicyDocument>): Promise<PolicyDocument | undefined> {
    const document = this.policyDocuments.get(id);
    if (!document) return undefined;

    const updatedDocument = { ...document, ...updates };
    this.policyDocuments.set(id, updatedDocument);
    return updatedDocument;
  }

  async listPolicyDocuments(userId?: number): Promise<PolicyDocument[]> {
    return Array.from(this.policyDocuments.values())
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async deletePolicyDocument(id: number): Promise<boolean> {
    return this.policyDocuments.delete(id);
  }

  async toggleFavorite(id: number): Promise<PolicyDocument | undefined> {
    const document = this.policyDocuments.get(id);
    if (!document) return undefined;
    
    const updated = { ...document, isFavorite: !document.isFavorite };
    this.policyDocuments.set(id, updated);
    return updated;
  }

  async updateTags(id: number, tags: string[]): Promise<PolicyDocument | undefined> {
    const document = this.policyDocuments.get(id);
    if (!document) return undefined;
    
    const updated = { ...document, tags };
    this.policyDocuments.set(id, updated);
    return updated;
  }

  async searchDocuments(query: string, userId?: number): Promise<PolicyDocument[]> {
    return Array.from(this.policyDocuments.values())
      .filter(doc => doc.originalName.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async createSummaryVersion(summaryData: InsertSummaryHistory): Promise<SummaryHistory> {
    // Mock implementation - in real app this would use database
    const mockSummary: SummaryHistory = {
      id: 1,
      documentId: summaryData.documentId,
      version: summaryData.version,
      summary: summaryData.summary,
      processingOptions: summaryData.processingOptions,
      createdAt: new Date(),
      isActive: summaryData.isActive || false,
    };
    return mockSummary;
  }

  async getSummaryHistory(documentId: number): Promise<SummaryHistory[]> {
    return []; // Mock implementation
  }

  async getActiveSummary(documentId: number): Promise<SummaryHistory | undefined> {
    return undefined; // Mock implementation
  }

  async setActiveSummary(documentId: number, versionId: number): Promise<boolean> {
    return true; // Mock implementation
  }

  async deleteSummaryVersion(versionId: number): Promise<boolean> {
    return true; // Mock implementation
  }

  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return undefined; // Mock implementation
  }

  async updateUserSettings(userId: number, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const mockSettings: UserSettings = {
      id: 1,
      userId,
      defaultProcessingOptions: {},
      exportPreferences: {},
      uiPreferences: {},
      updatedAt: new Date(),
    };
    return mockSettings;
  }

  async createDefaultSettings(userId: number): Promise<UserSettings> {
    const mockSettings: UserSettings = {
      id: 1,
      userId,
      defaultProcessingOptions: {},
      exportPreferences: {},
      uiPreferences: {},
      updatedAt: new Date(),
    };
    return mockSettings;
  }
}

import { db } from "./db";
import { eq, like, desc, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    // Create default settings for new user
    await this.createDefaultSettings(user.id);
    return user;
  }

  // Policy document methods
  async createPolicyDocument(insertDocument: InsertPolicyDocument): Promise<PolicyDocument> {
    const [document] = await db.insert(policyDocuments).values(insertDocument).returning();
    return document;
  }

  async getPolicyDocument(id: number): Promise<PolicyDocument | undefined> {
    const [document] = await db.select().from(policyDocuments).where(eq(policyDocuments.id, id));
    if (document) {
      // Update last viewed time
      await db.update(policyDocuments)
        .set({ lastViewedAt: new Date() })
        .where(eq(policyDocuments.id, id));
    }
    return document || undefined;
  }

  async updatePolicyDocument(id: number, updates: Partial<PolicyDocument>): Promise<PolicyDocument | undefined> {
    const [updated] = await db.update(policyDocuments)
      .set(updates)
      .where(eq(policyDocuments.id, id))
      .returning();
    return updated || undefined;
  }

  async listPolicyDocuments(userId?: number): Promise<PolicyDocument[]> {
    const query = db.select().from(policyDocuments).orderBy(desc(policyDocuments.uploadedAt));
    if (userId) {
      return await query.where(eq(policyDocuments.userId, userId));
    }
    return await query;
  }

  async deletePolicyDocument(id: number): Promise<boolean> {
    // Delete summary history first
    await db.delete(summaryHistory).where(eq(summaryHistory.documentId, id));
    // Then delete document
    const result = await db.delete(policyDocuments).where(eq(policyDocuments.id, id));
    return result.rowCount > 0;
  }

  async toggleFavorite(id: number): Promise<PolicyDocument | undefined> {
    const document = await this.getPolicyDocument(id);
    if (!document) return undefined;
    
    const [updated] = await db.update(policyDocuments)
      .set({ isFavorite: !document.isFavorite })
      .where(eq(policyDocuments.id, id))
      .returning();
    return updated || undefined;
  }

  async updateTags(id: number, tags: string[]): Promise<PolicyDocument | undefined> {
    const [updated] = await db.update(policyDocuments)
      .set({ tags })
      .where(eq(policyDocuments.id, id))
      .returning();
    return updated || undefined;
  }

  async searchDocuments(query: string, userId?: number): Promise<PolicyDocument[]> {
    const searchConditions = [
      like(policyDocuments.originalName, `%${query}%`),
    ];
    
    if (userId) {
      searchConditions.push(eq(policyDocuments.userId, userId));
    }

    return await db.select()
      .from(policyDocuments)
      .where(and(...searchConditions))
      .orderBy(desc(policyDocuments.uploadedAt));
  }

  // Summary history methods
  async createSummaryVersion(summaryData: InsertSummaryHistory): Promise<SummaryHistory> {
    // Deactivate current active summary
    await db.update(summaryHistory)
      .set({ isActive: false })
      .where(and(
        eq(summaryHistory.documentId, summaryData.documentId),
        eq(summaryHistory.isActive, true)
      ));

    // Get next version number
    const existingVersions = await db.select()
      .from(summaryHistory)
      .where(eq(summaryHistory.documentId, summaryData.documentId))
      .orderBy(desc(summaryHistory.version));
    
    const nextVersion = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

    const [summary] = await db.insert(summaryHistory)
      .values({
        ...summaryData,
        version: nextVersion,
        isActive: true,
      })
      .returning();
    
    return summary;
  }

  async getSummaryHistory(documentId: number): Promise<SummaryHistory[]> {
    return await db.select()
      .from(summaryHistory)
      .where(eq(summaryHistory.documentId, documentId))
      .orderBy(desc(summaryHistory.version));
  }

  async getActiveSummary(documentId: number): Promise<SummaryHistory | undefined> {
    const [summary] = await db.select()
      .from(summaryHistory)
      .where(and(
        eq(summaryHistory.documentId, documentId),
        eq(summaryHistory.isActive, true)
      ));
    return summary || undefined;
  }

  async setActiveSummary(documentId: number, versionId: number): Promise<boolean> {
    // Deactivate all summaries for this document
    await db.update(summaryHistory)
      .set({ isActive: false })
      .where(eq(summaryHistory.documentId, documentId));

    // Activate the selected summary
    const result = await db.update(summaryHistory)
      .set({ isActive: true })
      .where(eq(summaryHistory.id, versionId));
    
    return result.rowCount > 0;
  }

  async deleteSummaryVersion(versionId: number): Promise<boolean> {
    const result = await db.delete(summaryHistory).where(eq(summaryHistory.id, versionId));
    return result.rowCount > 0;
  }

  // Settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async updateUserSettings(userId: number, settingsUpdate: Partial<InsertUserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    
    if (existing) {
      const [updated] = await db.update(userSettings)
        .set({ ...settingsUpdate, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      return updated;
    } else {
      return await this.createDefaultSettings(userId);
    }
  }

  async createDefaultSettings(userId: number): Promise<UserSettings> {
    const [settings] = await db.insert(userSettings)
      .values({ userId })
      .returning();
    return settings;
  }
}

export const storage = new DatabaseStorage();
