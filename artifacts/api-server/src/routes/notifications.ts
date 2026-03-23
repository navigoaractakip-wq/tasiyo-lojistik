import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListNotificationsResponse, MarkNotificationReadResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function mapNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: String(n.id),
    type: n.type as "new_load" | "offer_received" | "offer_accepted" | "offer_rejected" | "shipment_update" | "system",
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    relatedId: n.relatedId ?? undefined,
    createdAt: n.createdAt,
  };
}

router.get("/notifications", async (req, res): Promise<void> => {
  const { unreadOnly } = req.query;
  const allNotifs = await db.select().from(notificationsTable).orderBy(notificationsTable.createdAt);
  const filtered = unreadOnly === "true" ? allNotifs.filter((n) => !n.isRead) : allNotifs;
  const unreadCount = allNotifs.filter((n) => !n.isRead).length;

  res.json(
    ListNotificationsResponse.parse({
      notifications: filtered.map(mapNotification),
      unreadCount,
    })
  );
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [notif] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id))
    .returning();

  if (!notif) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(MarkNotificationReadResponse.parse(mapNotification(notif)));
});

export default router;
