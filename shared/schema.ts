import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  hostname: text("hostname"),
  ip: text("ip"),
  platform: text("platform"),
  platformRelease: text("platform_release"),
  platformVersion: text("platform_version"),
  architecture: text("architecture"),
  processor: text("processor"),
  username: text("username"),
  screenResolution: text("screen_resolution"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  firstSeen: timestamp("first_seen").defaultNow(),
  beaconInterval: integer("beacon_interval").default(3600),
  jitter: integer("jitter").default(300),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  lastSeen: true,
  firstSeen: true,
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export const screenshots = pgTable("screenshots", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  imageData: text("image_data").notNull(), // Base64 encoded image
  width: integer("width"),
  height: integer("height"),
});

export const insertScreenshotSchema = createInsertSchema(screenshots).omit({
  id: true,
  timestamp: true,
});

export type InsertScreenshot = z.infer<typeof insertScreenshotSchema>;
export type Screenshot = typeof screenshots.$inferSelect;

export const commands = pgTable("commands", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  command: text("command").notNull(),
  output: text("output"),
  status: text("status").default("pending"), // pending, success, error
  elevatedPrivileges: boolean("elevated_privileges").default(false),
  waitForOutput: boolean("wait_for_output").default(true),
  executionTime: text("execution_time"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertCommandSchema = createInsertSchema(commands).omit({
  id: true,
  output: true,
  status: true,
  executionTime: true,
  timestamp: true,
});

export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type Command = typeof commands.$inferSelect;

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id"),
  clientId: text("client_id"),
  activityType: text("activity_type").notNull(), // connect, disconnect, screenshot, command, etc.
  details: jsonb("details"), // Additional details in JSON format
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
