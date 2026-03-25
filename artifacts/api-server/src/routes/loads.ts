import { Router, type IRouter } from "express";
import { db, loadsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListLoadsResponse,
  CreateLoadBody,
  GetLoadResponse,
  UpdateLoadBody,
  UpdateLoadResponse,
} from "@workspace/api-zod";
import { optionalAuth, type AuthRequest } from "../lib/auth-middleware";

const router: IRouter = Router();

function mapLoad(load: typeof loadsTable.$inferSelect, poster?: typeof usersTable.$inferSelect | null) {
  return {
    id: String(load.id),
    title: load.title,
    description: load.description ?? undefined,
    origin: load.origin,
    destination: load.destination,
    distance: load.distance ?? undefined,
    weight: load.weight ?? undefined,
    loadType: load.loadType,
    vehicleType: load.vehicleType,
    pricingModel: load.pricingModel as "fixed" | "bidding",
    price: load.price ?? undefined,
    minBid: load.minBid ?? undefined,
    maxBid: load.maxBid ?? undefined,
    status: load.status as "active" | "pending" | "assigned" | "completed" | "cancelled",
    isPremium: load.isPremium ?? false,
    postedBy: poster
      ? {
          id: String(poster.id),
          name: poster.name,
          email: poster.email,
          role: poster.role as "admin" | "corporate" | "individual" | "driver",
          status: poster.status as "active" | "suspended" | "pending",
          createdAt: poster.createdAt,
        }
      : undefined,
    offersCount: load.offersCount ?? 0,
    pickupDate: load.pickupDate ?? undefined,
    deliveryDate: load.deliveryDate ?? undefined,
    createdAt: load.createdAt,
    originLat: load.originLat ?? undefined,
    originLng: load.originLng ?? undefined,
    destLat: load.destLat ?? undefined,
    destLng: load.destLng ?? undefined,
  };
}

router.get("/loads", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const { status, vehicleType, loadType, mine } = req.query;

  const allLoads = await db.select().from(loadsTable).orderBy(loadsTable.createdAt);

  let filtered = allLoads;
  if (status && typeof status === "string") filtered = filtered.filter((l) => l.status === status);
  if (vehicleType && typeof vehicleType === "string") filtered = filtered.filter((l) => l.vehicleType === vehicleType);
  if (loadType && typeof loadType === "string") filtered = filtered.filter((l) => l.loadType === loadType);
  // When ?mine=true is sent, return only the authenticated user's loads
  if (mine === "true" && req.userId) {
    filtered = filtered.filter((l) => l.postedById === req.userId);
  }

  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const mapped = filtered.map((l) => mapLoad(l, l.postedById ? userMap.get(l.postedById) : null));

  res.json(
    ListLoadsResponse.parse({
      loads: mapped,
      total: mapped.length,
      page: 1,
      pageSize: mapped.length,
    })
  );
});

router.post("/loads", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateLoadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data;
  const [load] = await db
    .insert(loadsTable)
    .values({
      title: d.title,
      description: d.description ?? null,
      origin: d.origin,
      destination: d.destination,
      weight: d.weight ?? null,
      loadType: d.loadType,
      vehicleType: d.vehicleType,
      pricingModel: d.pricingModel,
      price: d.price ?? null,
      minBid: d.minBid ?? null,
      pickupDate: d.pickupDate ?? null,
      deliveryDate: d.deliveryDate ?? null,
      distance: Math.floor(Math.random() * 800) + 50,
      originLat: 39.9334 + (Math.random() - 0.5) * 5,
      originLng: 32.8597 + (Math.random() - 0.5) * 10,
      destLat: 39.9334 + (Math.random() - 0.5) * 5,
      destLng: 32.8597 + (Math.random() - 0.5) * 10,
      postedById: req.userId ?? null,
    })
    .returning();

  let poster = null;
  if (load.postedById) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, load.postedById));
    poster = u || null;
  }

  res.status(201).json(GetLoadResponse.parse(mapLoad(load, poster)));
});

router.get("/loads/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, id));
  if (!load) {
    res.status(404).json({ error: "Load not found" });
    return;
  }

  let poster = null;
  if (load.postedById) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, load.postedById));
    poster = u || null;
  }

  res.json(GetLoadResponse.parse(mapLoad(load, poster)));
});

router.patch("/loads/:id", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateLoadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Fetch existing load
  const existing = await db.select().from(loadsTable).where(eq(loadsTable.id, id)).limit(1);
  const existingLoad = existing[0];
  if (!existingLoad) {
    res.status(404).json({ error: "Load not found" });
    return;
  }

  // Full field edits (title, origin, etc.) require ownership + no offers
  const isFullEdit = parsed.data.title !== undefined || parsed.data.origin !== undefined ||
    parsed.data.destination !== undefined || parsed.data.weight !== undefined ||
    parsed.data.loadType !== undefined || parsed.data.vehicleType !== undefined ||
    parsed.data.pricingModel !== undefined || parsed.data.pickupDate !== undefined ||
    parsed.data.deliveryDate !== undefined || parsed.data.description !== undefined;

  if (isFullEdit) {
    if (!req.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (existingLoad.postedById !== req.userId) {
      res.status(403).json({ error: "Bu ilanı düzenleme yetkiniz yok" });
      return;
    }
    if ((existingLoad.offersCount ?? 0) > 0) {
      res.status(409).json({ error: "Teklif almış ilanlar düzenlenemez" });
      return;
    }
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.price !== undefined) updates.price = parsed.data.price;
  if (parsed.data.isPremium !== undefined) updates.isPremium = parsed.data.isPremium;
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.origin !== undefined) updates.origin = parsed.data.origin;
  if (parsed.data.destination !== undefined) updates.destination = parsed.data.destination;
  if (parsed.data.weight !== undefined) updates.weight = parsed.data.weight;
  if (parsed.data.loadType !== undefined) updates.loadType = parsed.data.loadType;
  if (parsed.data.vehicleType !== undefined) updates.vehicleType = parsed.data.vehicleType;
  if (parsed.data.pricingModel !== undefined) updates.pricingModel = parsed.data.pricingModel;
  if (parsed.data.pickupDate !== undefined) updates.pickupDate = parsed.data.pickupDate;
  if (parsed.data.deliveryDate !== undefined) updates.deliveryDate = parsed.data.deliveryDate;

  const [load] = await db.update(loadsTable).set(updates).where(eq(loadsTable.id, id)).returning();
  if (!load) {
    res.status(404).json({ error: "Load not found" });
    return;
  }

  res.json(UpdateLoadResponse.parse(mapLoad(load)));
});

router.delete("/loads/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db.delete(loadsTable).where(eq(loadsTable.id, id)).returning({ id: loadsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Load not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
