import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const driverReviewsTable = pgTable("driver_reviews", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").notNull(),
  driverId: integer("driver_id").notNull(),
  corporateId: integer("corporate_id").notNull(),
  rating: real("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDriverReviewSchema = createInsertSchema(driverReviewsTable).omit({ id: true, createdAt: true });
export type InsertDriverReview = z.infer<typeof insertDriverReviewSchema>;
export type DbDriverReview = typeof driverReviewsTable.$inferSelect;
