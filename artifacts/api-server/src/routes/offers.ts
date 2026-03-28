import { Router, type IRouter } from "express";
import { db, offersTable, loadsTable, usersTable, shipmentsTable, shipmentEventsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListOffersResponse,
  CreateOfferBody,
  AcceptOfferResponse,
  RejectOfferResponse,
} from "@workspace/api-zod";
import { optionalAuth, requireAuth, type AuthRequest } from "../lib/auth-middleware";

const router: IRouter = Router();

function mapOffer(
  offer: typeof offersTable.$inferSelect,
  driver?: typeof usersTable.$inferSelect | null,
  load?: typeof loadsTable.$inferSelect | null,
  poster?: typeof usersTable.$inferSelect | null,
) {
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
          pickupDate: load.pickupDate ?? undefined,
          createdAt: load.createdAt,
          postedBy: poster
            ? {
                id: String(poster.id),
                name: poster.name,
                email: poster.email,
                phone: poster.phone ?? undefined,
                role: poster.role as "admin" | "corporate" | "individual" | "driver",
                status: poster.status as "active" | "suspended" | "pending",
                company: poster.company ?? undefined,
                address: poster.address ?? undefined,
                avatarUrl: poster.avatarUrl ?? undefined,
                rating: poster.rating ?? undefined,
                totalShipments: poster.totalShipments ?? undefined,
                createdAt: poster.createdAt,
              }
            : undefined,
        }
      : undefined,
  };
}

// GET /offers — supports ?mine=true (returns offers on the authenticated user's loads)
router.get("/offers", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const { loadId, status, mine, byMe } = req.query;

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

  // ?byMe=true → for driver: only offers the authenticated user submitted
  if (byMe === "true" && req.userId) {
    filtered = filtered.filter((o) => o.driverId === req.userId);
  }

  const mapped = filtered.map((o) => {
    const load = loadMap.get(o.loadId);
    const poster = load?.postedById ? userMap.get(load.postedById) : undefined;
    return mapOffer(o, userMap.get(o.driverId), load, poster);
  });
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

  // Şoför profil tamamlama kontrolü
  const [driverUser] = await db.select().from(usersTable).where(eq(usersTable.id, driverId));
  if (driverUser && (driverUser.role === "individual" || driverUser.role === "driver")) {
    if (!driverUser.vehicleTypes || !driverUser.vehiclePlate) {
      res.status(403).json({ error: "DRIVER_PROFILE_INCOMPLETE", message: "Teklif verebilmek için araç tipi ve plaka bilgilerinizi profilinizde tamamlayın." });
      return;
    }
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

  // Teklif kabul edilince otomatik sevkiyat oluştur (eğer yoksa)
  const existingShipments = await db
    .select()
    .from(shipmentsTable)
    .where(eq(shipmentsTable.loadId, offer.loadId));

  const hasActive = existingShipments.some(s => s.status !== "cancelled" && s.status !== "delivered");

  if (!hasActive) {
    const [newShipment] = await db
      .insert(shipmentsTable)
      .values({
        loadId: offer.loadId,
        driverId: offer.driverId,
        status: "assigned",
      })
      .returning();

    // İlk event kaydı
    await db.insert(shipmentEventsTable).values({
      shipmentId: newShipment.id,
      event: "assigned",
      description: "Teklif kabul edildi. Şoför yükleme noktasına yönlendirilecek.",
    });

    // İlanı "assigned" olarak işaretle
    await db.update(loadsTable).set({ status: "assigned" }).where(eq(loadsTable.id, offer.loadId));
  }

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

// POST /offers/:id/withdraw — Driver geri çekme: pending veya accepted teklifler
router.post("/offers/:id/withdraw", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Geçersiz teklif ID" }); return; }

  if (!req.userId) {
    res.status(401).json({ error: "Bu işlem için giriş yapmalısınız." });
    return;
  }

  const [existing] = await db.select().from(offersTable).where(eq(offersTable.id, id));
  if (!existing) { res.status(404).json({ error: "Teklif bulunamadı." }); return; }

  if (existing.driverId !== req.userId) {
    res.status(403).json({ error: "Yalnızca kendi teklifinizi geri çekebilirsiniz." });
    return;
  }

  if (existing.status !== "pending" && existing.status !== "accepted") {
    res.status(409).json({ error: "Bu teklif geri çekilemez." });
    return;
  }

  const wasAccepted = existing.status === "accepted";

  const [offer] = await db
    .update(offersTable)
    .set({ status: "withdrawn" })
    .where(eq(offersTable.id, id))
    .returning();

  const [currentLoad] = await db.select().from(loadsTable).where(eq(loadsTable.id, existing.loadId));

  if (wasAccepted && currentLoad) {
    // Yük durumunu tekrar "active" yap
    await db.update(loadsTable)
      .set({ status: "active" })
      .where(eq(loadsTable.id, existing.loadId));

    // Aktif sevkiyatı iptal et
    const activeShipments = await db.select().from(shipmentsTable)
      .where(and(eq(shipmentsTable.loadId, existing.loadId), eq(shipmentsTable.driverId, existing.driverId)));
    for (const shipment of activeShipments) {
      if (shipment.status !== "cancelled" && shipment.status !== "delivered") {
        await db.update(shipmentsTable).set({ status: "cancelled" }).where(eq(shipmentsTable.id, shipment.id));
        await db.insert(shipmentEventsTable).values({
          shipmentId: shipment.id,
          event: "cancelled",
          description: "Şoför teklifi geri çekti. Yük tekrar aktif ilanlara alındı.",
        });
      }
    }
  }

  if (currentLoad) {
    const newCount = Math.max(0, (currentLoad.offersCount ?? 1) - 1);
    await db.update(loadsTable).set({ offersCount: newCount }).where(eq(loadsTable.id, existing.loadId));
  }

  const [driver] = await db.select().from(usersTable).where(eq(usersTable.id, offer.driverId));
  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, offer.loadId));

  res.json(mapOffer(offer, driver, load));
});

// POST /offers/:id/cancel-accepted — Kurumsal üye kabul ettiği teklifi iptal eder (yükleme gününe 1 gün kala)
router.post("/offers/:id/cancel-accepted", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Geçersiz teklif ID" }); return; }

  const [existing] = await db.select().from(offersTable).where(eq(offersTable.id, id));
  if (!existing) { res.status(404).json({ error: "Teklif bulunamadı." }); return; }

  if (existing.status !== "accepted") {
    res.status(409).json({ error: "Yalnızca kabul edilmiş teklifler iptal edilebilir." });
    return;
  }

  const [currentLoad] = await db.select().from(loadsTable).where(eq(loadsTable.id, existing.loadId));
  if (!currentLoad) { res.status(404).json({ error: "İlan bulunamadı." }); return; }

  // Kullanıcının bu ilanın sahibi olup olmadığını kontrol et
  if (currentLoad.postedById !== req.userId) {
    res.status(403).json({ error: "Bu teklifi iptal etme yetkiniz yok." });
    return;
  }

  // Yükleme tarihine 1 günden az kaldıysa iptal edilemez
  if (currentLoad.pickupDate) {
    const msRemaining = new Date(currentLoad.pickupDate).getTime() - Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (msRemaining < oneDayMs) {
      res.status(409).json({ error: "Yükleme tarihine 1 günden az kaldığı için teklif iptal edilemez." });
      return;
    }
  }

  // Teklifi "pending" durumuna geri al (load tekrar teklif alabilsin)
  const [offer] = await db
    .update(offersTable)
    .set({ status: "pending" })
    .where(eq(offersTable.id, id))
    .returning();

  // Yükü tekrar "active" yap
  await db.update(loadsTable).set({ status: "active" }).where(eq(loadsTable.id, existing.loadId));

  // Aktif sevkiyatı iptal et
  const activeShipments = await db.select().from(shipmentsTable)
    .where(and(eq(shipmentsTable.loadId, existing.loadId), eq(shipmentsTable.driverId, existing.driverId)));
  for (const shipment of activeShipments) {
    if (shipment.status !== "cancelled" && shipment.status !== "delivered") {
      await db.update(shipmentsTable).set({ status: "cancelled" }).where(eq(shipmentsTable.id, shipment.id));
      await db.insert(shipmentEventsTable).values({
        shipmentId: shipment.id,
        event: "cancelled",
        description: "Kurumsal üye teklip kabulünü geri aldı. Yük tekrar teklif almaya açıldı.",
      });
    }
  }

  const [driver] = await db.select().from(usersTable).where(eq(usersTable.id, offer.driverId));
  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, offer.loadId));

  res.json({ success: true, offer: mapOffer(offer, driver, load) });
});

export default router;
