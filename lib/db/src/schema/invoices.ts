import { pgTable, serial, integer, text, timestamp, real } from "drizzle-orm/pg-core";

export const planConfigsTable = pgTable("plan_configs", {
  id: serial("id").primaryKey(),
  planId: text("plan_id").notNull().unique(),
  name: text("name").notNull(),
  price: real("price").notNull().default(0),
  currency: text("currency").notNull().default("TRY"),
  features: text("features").notNull().default("[]"),
  badge: text("badge"),
  highlighted: text("highlighted").notNull().default("false"),
  sortOrder: integer("sort_order").notNull().default(0),
  targetRole: text("target_role").notNull().default("corporate"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  transactionId: integer("transaction_id"),
  invoiceNo: text("invoice_no"),
  amount: real("amount"),
  currency: text("currency").notNull().default("TRY"),
  description: text("description"),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull().default("application/pdf"),
  fileSize: integer("file_size"),
  fileData: text("file_data").notNull(),
  uploadedBy: integer("uploaded_by"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});
