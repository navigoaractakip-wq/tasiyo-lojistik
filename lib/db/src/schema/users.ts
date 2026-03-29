import { pgTable, text, serial, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").notNull().default("individual"),
  status: text("status").notNull().default("active"),
  company: text("company"),
  avatarUrl: text("avatar_url"),
  website: text("website"),
  address: text("address"),
  taxNumber: text("tax_number"),
  vehicleTypes: text("vehicle_types"),
  vehiclePlate: text("vehicle_plate"),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  notificationSettings: text("notification_settings"),
  billingInfo: text("billing_info"),
  taxOffice: text("tax_office"),
  driverLicenseToken: text("driver_license_token"),
  driverDocuments: text("driver_documents"),
  rating: real("rating").default(5.0),
  totalShipments: integer("total_shipments").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DbUser = typeof usersTable.$inferSelect;
