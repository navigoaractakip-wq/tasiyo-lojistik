import { pgTable, serial, integer, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userConsentsTable = pgTable("user_consents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  termsAccepted: boolean("terms_accepted").notNull().default(false),
  privacyAccepted: boolean("privacy_accepted").notNull().default(false),
  distanceSalesAccepted: boolean("distance_sales_accepted").notNull().default(false),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  locationConsent: boolean("location_consent").notNull().default(false),
  ipAddress: text("ip_address"),
  consentTimestamp: timestamp("consent_timestamp", { withTimezone: true }).notNull().defaultNow(),
  termsVersion: integer("terms_version").notNull().default(1),
  privacyVersion: integer("privacy_version").notNull().default(1),
  distanceSalesVersion: integer("distance_sales_version").notNull().default(1),
});

export type DbUserConsent = typeof userConsentsTable.$inferSelect;
