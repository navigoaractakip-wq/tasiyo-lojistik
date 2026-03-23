import { pgTable, text, serial, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loadsTable = pgTable("loads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  distance: real("distance"),
  weight: real("weight"),
  loadType: text("load_type").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  pricingModel: text("pricing_model").notNull().default("fixed"),
  price: real("price"),
  minBid: real("min_bid"),
  maxBid: real("max_bid"),
  status: text("status").notNull().default("active"),
  isPremium: boolean("is_premium").default(false),
  postedById: integer("posted_by_id"),
  offersCount: integer("offers_count").default(0),
  pickupDate: timestamp("pickup_date", { withTimezone: true }),
  deliveryDate: timestamp("delivery_date", { withTimezone: true }),
  originLat: real("origin_lat"),
  originLng: real("origin_lng"),
  destLat: real("dest_lat"),
  destLng: real("dest_lng"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLoadSchema = createInsertSchema(loadsTable).omit({ id: true, createdAt: true });
export type InsertLoad = z.infer<typeof insertLoadSchema>;
export type DbLoad = typeof loadsTable.$inferSelect;
