import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const supportTicketsTable = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  category: text("category").notNull().default("general"),
  priority: text("priority").notNull().default("normal"),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  adminId: integer("admin_id"),
  adminReply: text("admin_reply"),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  // Routing: "listing" category tickets go to the load owner, not admin
  targetUserId: integer("target_user_id"),   // load owner (corporate) for "listing" tickets
  loadId: integer("load_id"),                // which load the ticket is about
  loadTitle: text("load_title"),             // snapshot of load title at creation time
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SupportTicket = typeof supportTicketsTable.$inferSelect;
export type InsertSupportTicket = typeof supportTicketsTable.$inferInsert;
