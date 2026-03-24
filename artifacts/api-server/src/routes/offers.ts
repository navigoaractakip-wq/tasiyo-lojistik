import { Router, type IRouter } from "express";
import { db, offersTable, loadsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListOffersResponse,
  CreateOfferBody,
  AcceptOfferResponse,
  RejectOfferResponse,
} from "@workspace/api-zod";
import { optionalAuth, type AuthRequest } from "../lib/auth-middleware";

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

// GET /offers — supports ?mine=true (returns offers on the authenticated user's loads)
router.get("/offers", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const { loadId, status, mine } = req.query;

  const allOffers = await db.select().from(offersTable).orderBy(offersTable.createdAt);
  const allUsers = await db.select().from(usersTable);
  const allLoads = await db.select().from(loadsTable);

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const loadMap = new Map(allLoads.map((l) => [l.id, l]));

  let filtered = allOffers;
  if (loadId && typeof loadId === "string") filtered = filtered.filter((o) => String(o.loadId) === loadId);
  if (status && typeof status === "string") filtered = filtered.filter((o) => o.status === status);

  // ?mine=true → for corporate: only offers on the user's own loads
  if (mine === "true" && req.userId) {
    const myLoadIds = new Set(allLoads.filter((l) => l.postedById === req.userId).map((l) => l.id));
    filtered = filtered.filter((o) => myLoadIds.has(o.loadId));
  }

  const mapped = filtered.map((o) => mapOffer(o, userMap.get(o.driverId), loadMap.get(o.loadId)));
  res.json(ListOffersResponse.parse({ offers: mapped, total: mapped.length }));
});

// POST /offers — requires auth to set driverId
router.post("/offers", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateOfferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const driverId = req.userId;
  if (!driverId) {
    res.status(401).json({ error: "Teklif vermek için giriş yapmalısınız." });
    return;
  }

  const loadId = parseInt(parsed.data.loadId, 10);

  // Prevent duplicate pending offers from same driver on same load
  const existing = await db
    .select()
    .from(offersTable)
    .where(eq(offersTable.loadId, loadId));
  const hasPending = existing.some((o) => o.driverId === driverId && o.status === "pending");
  if (hasPending) {
    res.status(409).json({ error: "Bu ilana zaten bekleyen bir teklifiniz var." });
    return;
  }

  const [offer] = await db
    .insert(offersTable)
    .values({
      loadId,
      driverId,
      amount: parsed.data.amount,
      note: parsed.data.note ?? null,
    })
    .returning();

  // Increment offersCount
  const currentLoad = await db.select().from(loadsTable).where(eq(loadsTable.id, loadId));
  const currentCount = currentLoad[0]?.offersCount ?? 0;
  await db
    .update(loadsTable)
    .set({ offersCount: currentCount + 1 })
    .where(eq(loadsTable.id, loadId));

  const [driver] = await db.select().from(usersTable).where(eq(usersTable.id, offer.driverId));
  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, offer.loadId));

  res.status(201).json(mapOffer(offer, driver, load));
});

router.post("/offers/:id/accept", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [offer] = await db
    .update(offersTable)
    .set({ status: "accepted" })
    .where(eq(offersTable.id, id))
    .returning();

  if (!offer) { res.status(404).json({ error: "Offer not found" }); return; }

  const [driver] = await db.select().from(usersTable).where(eq(usersTable.id, offer.driverId));
  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, offer.loadId));

  res.json(AcceptOfferResponse.parse(mapOffer(offer, driver, load)));
});

router.post("/offers/:id/reject", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [offer] = await db
    .update(offersTable)
    .set({ status: "rejected" })
    .where(eq(offersTable.id, id))
    .returning();

  if (!offer) { res.status(404).json({ error: "Offer not found" }); return; }

  const [driver] = await db.select().from(usersTable).where(eq(usersTable.id, offer.driverId));
  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, offer.loadId));

  res.json(RejectOfferResponse.parse(mapOffer(offer, driver, load)));
});

export default router;
