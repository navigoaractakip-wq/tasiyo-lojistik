import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const contractsTable = pgTable("contracts", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DbContract = typeof contractsTable.$inferSelect;
