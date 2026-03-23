import { Router, type IRouter } from "express";
import { db, offersTable, loadsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListOffersResponse,
  CreateOfferBody,
  AcceptOfferResponse,
  RejectOfferResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapOffer(offer: typeof offersTable.$inferSelect, driver?: typeof usersTable.$inferSelect | null, load?: typeof loadsTable.$inferSelect | null) {
  return {
    id: String(offer.id),
    loadId: String(offer.loadId),
    amount: offer.amount,
    note: offer.note ?? undefined,
    status: offer.status as "pending" | "accepted" | "rejected" | "withdrawn",
    createdAt: offer.createdAt,
    driver: driver
      ? {
          id: String(driver.id),
          name: driver.name,
          email: driver.email,
          phone: driver.phone ?? undefined,
          role: driver.role as "admin" | "corporate" | "individual" | "driver",
          status: driver.status as "active" | "suspended" | "pending",
          rating: driver.rating ?? undefined,
          avatarUrl: driver.avatarUrl ?? undefined,
          createdAt: driver.createdAt,
        }
      : undefined,
    load: load
      ? {
          id: String(load.id),
          title: load.title,
          origin: load.origin,
          destination: load.destination,
          loadType: load.loadType,
          vehicleType: load.vehicleType,
          pricingModel: load.pricingModel as "fixed" | "bidding",
          status: load.status as "active" | "pending" | "assigned" | "completed" | "cancelled",
          price: load.price ?? undefined,
          createdAt: load.createdAt,
        }
      : undefined,
  };
}

router.get("/offers", async (req, res): Promise<void> => {
  const { loadId, status } = req.query;

  const allOffers = await db.select().from(offersTable).orderBy(offersTable.createdAt);
  let filtered = allOffers;
  if (loadId && typeof loadId === "string") filtered = filtered.filter((o) => String(o.loadId) === loadId);
  if (status && typeof status === "string") filtered = filtered.filter((o) => o.status === status);

  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const allLoads = await db.select().from(loadsTable);
  const loadMap = new Map(allLoads.map((l) => [l.id, l]));

  const mapped = filtered.map((o) => mapOffer(o, userMap.get(o.driverId), loadMap.get(o.loadId)));

  res.json(ListOffersResponse.parse({ offers: mapped, total: mapped.length }));
});

router.post("/offers", async (req, res): Promise<void> => {
  const parsed = CreateOfferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const loadId = parseInt(parsed.data.loadId, 10);
  const [offer] = await db
    .insert(offersTable)
    .values({
      loadId,
      driverId: 1,
      amount: parsed.data.amount,
      note: parsed.data.note ?? null,
    })
    .returning();

  await db
    .update(loadsTable)
    .set({ offersCount: 1 })
    .where(eq(loadsTable.id, loadId));

  const [driver] = await db.select().from(usersTable).where(eq(usersTable.id, offer.driverId));
  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, offer.loadId));

  res.status(201).json(mapOffer(offer, driver, load));
});

router.post("/offers/:id/accept", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [offer] = await db
    .update(offersTable)
    .set({ status: "accepted" })
    .where(eq(offersTable.id, id))
    .returning();

  if (!offer) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }

  res.json(AcceptOfferResponse.parse(mapOffer(offer)));
});

router.post("/offers/:id/reject", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [offer] = await db
    .update(offersTable)
    .set({ status: "rejected" })
    .where(eq(offersTable.id, id))
    .returning();

  if (!offer) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }

  res.json(RejectOfferResponse.parse(mapOffer(offer)));
});

export default router;
