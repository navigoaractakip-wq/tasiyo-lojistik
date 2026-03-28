import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const otpCodesTable = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull(),
  identifierType: text("identifier_type").notNull(),
  code: text("code").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  sentVia: text("sent_via"),
  userLabel: text("user_label"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSessionsTable = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const platformSettingsTable = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  label: text("label").notNull(),
  description: text("description"),
  group: text("group").notNull().default("general"),
  isSecret: boolean("is_secret").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOtpCodeSchema = createInsertSchema(otpCodesTable).omit({ id: true, createdAt: true });
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
export type DbOtpCode = typeof otpCodesTable.$inferSelect;

export const insertUserSessionSchema = createInsertSchema(userSessionsTable).omit({ id: true, createdAt: true });
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type DbUserSession = typeof userSessionsTable.$inferSelect;

export type DbPlatformSetting = typeof platformSettingsTable.$inferSelect;
