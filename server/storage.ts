import { users, policyDocuments, type User, type InsertUser, type PolicyDocument, type InsertPolicyDocument } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Policy document methods
  createPolicyDocument(document: InsertPolicyDocument): Promise<PolicyDocument>;
  getPolicyDocument(id: number): Promise<PolicyDocument | undefined>;
  updatePolicyDocument(id: number, updates: Partial<PolicyDocument>): Promise<PolicyDocument | undefined>;
  listPolicyDocuments(): Promise<PolicyDocument[]>;
  deletePolicyDocument(id: number): Promise<boolean>;
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

  async listPolicyDocuments(): Promise<PolicyDocument[]> {
    return Array.from(this.policyDocuments.values())
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async deletePolicyDocument(id: number): Promise<boolean> {
    return this.policyDocuments.delete(id);
  }
}

export const storage = new MemStorage();
