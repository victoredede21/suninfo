import { users, type User, type InsertUser, agents, type Agent, type InsertAgent, screenshots, type Screenshot, type InsertScreenshot, commands, type Command, type InsertCommand, activities, type Activity, type InsertActivity, settings, type Setting, type InsertSetting } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Agent methods
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentByClientId(clientId: string): Promise<Agent | undefined>;
  getAgents(options?: { isOnline?: boolean, limit?: number }): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(clientId: string, updates: Partial<InsertAgent>): Promise<Agent | undefined>;
  countAgents(options?: { isOnline?: boolean }): Promise<number>;
  deleteAgent(id: number): Promise<boolean>;
  
  // Screenshot methods
  getScreenshot(id: number): Promise<Screenshot | undefined>;
  getScreenshotsByAgentId(agentId: number, limit?: number): Promise<Screenshot[]>;
  getScreenshots(limit?: number): Promise<Screenshot[]>;
  createScreenshot(screenshot: InsertScreenshot): Promise<Screenshot>;
  deleteScreenshot(id: number): Promise<boolean>;
  
  // Command methods
  getCommand(id: number): Promise<Command | undefined>;
  getCommandsByAgentId(agentId: number, limit?: number): Promise<Command[]>;
  getCommands(limit?: number): Promise<Command[]>;
  createCommand(command: InsertCommand): Promise<Command>;
  updateCommand(id: number, updates: Partial<Command>): Promise<Command | undefined>;
  
  // Activity methods
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  getSettings(): Promise<Setting[]>;
  updateSetting(key: string, value: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
}

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
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Agent methods
  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }
  
  async getAgentByClientId(clientId: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.clientId, clientId));
    return agent || undefined;
  }
  
  async getAgents(options?: { isOnline?: boolean, limit?: number }): Promise<Agent[]> {
    let query = db.select().from(agents).orderBy(desc(agents.lastSeen));
    
    if (options?.isOnline !== undefined) {
      query = query.where(eq(agents.isOnline, options.isOnline));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }
  
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [newAgent] = await db
      .insert(agents)
      .values(agent)
      .returning();
    
    return newAgent;
  }
  
  async updateAgent(clientId: string, updates: Partial<InsertAgent>): Promise<Agent | undefined> {
    const [updatedAgent] = await db
      .update(agents)
      .set(updates)
      .where(eq(agents.clientId, clientId))
      .returning();
    
    return updatedAgent || undefined;
  }
  
  async countAgents(options?: { isOnline?: boolean }): Promise<number> {
    let queryBuilder = db.select({ count: sql<number>`count(*)` }).from(agents);
    
    if (options?.isOnline !== undefined) {
      queryBuilder = queryBuilder.where(eq(agents.isOnline, options.isOnline));
    }
    
    const [result] = await queryBuilder;
    return result?.count || 0;
  }
  
  async deleteAgent(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(agents)
      .where(eq(agents.id, id))
      .returning({ id: agents.id });
      
    return !!deleted;
  }
  
  // Screenshot methods
  async getScreenshot(id: number): Promise<Screenshot | undefined> {
    const [screenshot] = await db
      .select()
      .from(screenshots)
      .where(eq(screenshots.id, id));
      
    return screenshot || undefined;
  }
  
  async getScreenshotsByAgentId(agentId: number, limit?: number): Promise<Screenshot[]> {
    let query = db
      .select()
      .from(screenshots)
      .where(eq(screenshots.agentId, agentId))
      .orderBy(desc(screenshots.timestamp));
      
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async getScreenshots(limit?: number): Promise<Screenshot[]> {
    let query = db
      .select()
      .from(screenshots)
      .orderBy(desc(screenshots.timestamp));
      
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async createScreenshot(screenshot: InsertScreenshot): Promise<Screenshot> {
    const [newScreenshot] = await db
      .insert(screenshots)
      .values(screenshot)
      .returning();
      
    return newScreenshot;
  }
  
  async deleteScreenshot(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(screenshots)
      .where(eq(screenshots.id, id))
      .returning({ id: screenshots.id });
      
    return !!deleted;
  }
  
  // Command methods
  async getCommand(id: number): Promise<Command | undefined> {
    const [command] = await db
      .select()
      .from(commands)
      .where(eq(commands.id, id));
      
    return command || undefined;
  }
  
  async getCommandsByAgentId(agentId: number, limit?: number): Promise<Command[]> {
    let query = db
      .select()
      .from(commands)
      .where(eq(commands.agentId, agentId))
      .orderBy(desc(commands.timestamp));
      
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async getCommands(limit?: number): Promise<Command[]> {
    let query = db
      .select()
      .from(commands)
      .orderBy(desc(commands.timestamp));
      
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async createCommand(command: InsertCommand): Promise<Command> {
    const [newCommand] = await db
      .insert(commands)
      .values(command)
      .returning();
      
    return newCommand;
  }
  
  async updateCommand(id: number, updates: Partial<Command>): Promise<Command | undefined> {
    const [updatedCommand] = await db
      .update(commands)
      .set(updates)
      .where(eq(commands.id, id))
      .returning();
      
    return updatedCommand || undefined;
  }
  
  // Activity methods
  async getActivities(limit?: number): Promise<Activity[]> {
    let query = db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp));
      
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
      
    return newActivity;
  }
  
  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
      
    return setting || undefined;
  }
  
  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }
  
  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    const [updatedSetting] = await db
      .update(settings)
      .set({ value })
      .where(eq(settings.key, key))
      .returning();
      
    return updatedSetting || undefined;
  }
  
  async createSetting(setting: InsertSetting): Promise<Setting> {
    const [newSetting] = await db
      .insert(settings)
      .values(setting)
      .returning();
      
    return newSetting;
  }
}

export const storage = new DatabaseStorage();
