import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shipmentsTable = pgTable("shipments", {
  id: serial("id").primaryKey(),
  loadId: integer("load_id").notNull(),
  driverId: integer("driver_id"),
  status: text("status").notNull().default("pickup"),
  currentLat: real("current_lat"),
  currentLng: real("current_lng"),
  estimatedArrival: timestamp("estimated_arrival", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shipmentEventsTable = pgTable("shipment_events", {
  id: serial("id").primaryKey(),
  shipmentId: integer("shipment_id").notNull(),
  event: text("event").notNull(),
  description: text("description"),
  lat: real("lat"),
  lng: real("lng"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertShipmentSchema = createInsertSchema(shipmentsTable).omit({ id: true, createdAt: true });
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type DbShipment = typeof shipmentsTable.$inferSelect;
