import { Router, type IRouter } from "express";
import type { Request } from "express";
import { db, shipmentsTable, shipmentEventsTable, loadsTable, usersTable, userSessionsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { ListShipmentsResponse, GetShipmentResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function getAuthUser(req: Request): Promise<{ id: number; role: string } | null> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const now = new Date();
  const [session] = await db
    .select()
    .from(userSessionsTable)
    .where(and(eq(userSessionsTable.token, token), gt(userSessionsTable.expiresAt, now)));
  if (!session) return null;
  const [user] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));
  return user ?? null;
}

function mapShipment(
  shipment: typeof shipmentsTable.$inferSelect,
  events: (typeof shipmentEventsTable.$inferSelect)[],
  driver?: typeof usersTable.$inferSelect | null,
  load?: typeof loadsTable.$inferSelect | null
) {
  return {
    id: String(shipment.id),
    loadId: String(shipment.loadId),
    status: shipment.status as "assigned" | "pickup" | "in_transit" | "delivered" | "cancelled",
    currentLat: shipment.currentLat ?? undefined,
    currentLng: shipment.currentLng ?? undefined,
    estimatedArrival: shipment.estimatedArrival ?? undefined,
    createdAt: shipment.createdAt,
    driver: driver
      ? {
          id: String(driver.id),
          name: driver.name,
          email: driver.email,
          phone: driver.phone ?? undefined,
          role: driver.role as "admin" | "corporate" | "individual" | "driver",
          status: driver.status as "active" | "suspended" | "pending",
          rating: driver.rating ?? undefined,
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
          waypoints: load.waypoints ?? undefined,
        }
      : undefined,
    timeline: events.map((e) => ({
      id: String(e.id),
      event: e.event,
      description: e.description ?? undefined,
      timestamp: e.timestamp,
      lat: e.lat ?? undefined,
      lng: e.lng ?? undefined,
    })),
  };
}

router.get("/shipments", async (req, res): Promise<void> => {
  const { status, driverId: driverIdParam } = req.query;

  // Auth-aware filtering
  const authUser = await getAuthUser(req);
  const isDriver = authUser && (authUser.role === "driver" || authUser.role === "individual");
  const isCorporate = authUser && authUser.role === "corporate";

  const allShipments = await db.select().from(shipmentsTable).orderBy(shipmentsTable.createdAt);
  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const allLoads = await db.select().from(loadsTable);
  const loadMap = new Map(allLoads.map((l) => [l.id, l]));

  let filtered = allShipments;

  // Driver → only their own shipments
  if (isDriver) {
    filtered = filtered.filter((s) => s.driverId === authUser!.id);
  }
  // Corporate → only shipments for their own loads (postedById = corporate user id)
  else if (isCorporate) {
    const ownLoadIds = new Set(allLoads.filter(l => l.postedById === authUser!.id).map(l => l.id));
    filtered = filtered.filter((s) => ownLoadIds.has(s.loadId));
  }
  // driverIdParam fallback (admin/public use)
  else if (driverIdParam && typeof driverIdParam === "string") {
    const dId = parseInt(driverIdParam, 10);
    if (!isNaN(dId)) filtered = filtered.filter((s) => s.driverId === dId);
  }

  if (status && typeof status === "string") {
    // Support comma-separated statuses: "pickup,in_transit"
    const statuses = status.split(",").map(s => s.trim());
    filtered = filtered.filter((s) => statuses.includes(s.status));
  }
  const allEvents = await db.select().from(shipmentEventsTable);
  const eventsMap = new Map<number, (typeof shipmentEventsTable.$inferSelect)[]>();
  for (const e of allEvents) {
    if (!eventsMap.has(e.shipmentId)) eventsMap.set(e.shipmentId, []);
    eventsMap.get(e.shipmentId)!.push(e);
  }

  const mapped = filtered.map((s) =>
    mapShipment(s, eventsMap.get(s.id) ?? [], s.driverId ? userMap.get(s.driverId) : null, loadMap.get(s.loadId))
  );

  res.json(ListShipmentsResponse.parse({ shipments: mapped, total: mapped.length, page: 1, pageSize: mapped.length }));
});

router.patch("/shipments/:id/status", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { status, event, description, lat, lng } = req.body;

  // En az biri gerekli: status (ana durum değişimi) veya event (ara durak kaydı)
  if (!status && !event) { res.status(400).json({ error: "status or event required" }); return; }

  const validStatuses = ["assigned", "pickup", "in_transit", "delivered", "cancelled"];
  if (status && !validStatuses.includes(status)) { res.status(400).json({ error: "invalid status" }); return; }

  let shipment: typeof shipmentsTable.$inferSelect;

  if (status) {
    // Ana durum güncellemesi
    const [updated] = await db
      .update(shipmentsTable)
      .set({
        status,
        ...(lat != null && lng != null ? { currentLat: lat, currentLng: lng } : {}),
      })
      .where(eq(shipmentsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Shipment not found" }); return; }
    shipment = updated;
  } else {
    // Sadece event kaydı — ana durumu değiştirme
    const [existing] = await db.select().from(shipmentsTable).where(eq(shipmentsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Shipment not found" }); return; }
    shipment = existing;
    if (lat != null && lng != null) {
      await db.update(shipmentsTable).set({ currentLat: lat, currentLng: lng }).where(eq(shipmentsTable.id, id));
    }
  }

  // Event kaydı yap (status veya custom event adı)
  const eventName = event ?? status;
  await db.insert(shipmentEventsTable).values({
    shipmentId: id,
    event: eventName,
    description: description ?? null,
    lat: lat ?? null,
    lng: lng ?? null,
  });

  const events = await db.select().from(shipmentEventsTable).where(eq(shipmentEventsTable.shipmentId, id));
  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, shipment.loadId));
  let driver = null;
  if (shipment.driverId) {
    const [d] = await db.select().from(usersTable).where(eq(usersTable.id, shipment.driverId));
    driver = d || null;
  }

  res.json(GetShipmentResponse.parse(mapShipment(shipment, events, driver, load)));
});

router.patch("/shipments/:id/location", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { lat, lng } = req.body;
  if (lat == null || lng == null) { res.status(400).json({ error: "lat and lng required" }); return; }

  const [shipment] = await db
    .update(shipmentsTable)
    .set({ currentLat: lat, currentLng: lng })
    .where(eq(shipmentsTable.id, id))
    .returning();

  if (!shipment) { res.status(404).json({ error: "Shipment not found" }); return; }
  res.json({ ok: true, lat, lng });
});

router.get("/shipments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [shipment] = await db.select().from(shipmentsTable).where(eq(shipmentsTable.id, id));
  if (!shipment) {
    res.status(404).json({ error: "Shipment not found" });
    return;
  }

  const events = await db.select().from(shipmentEventsTable).where(eq(shipmentEventsTable.shipmentId, id));

  let driver = null;
  if (shipment.driverId) {
    const [d] = await db.select().from(usersTable).where(eq(usersTable.id, shipment.driverId));
    driver = d || null;
  }

  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, shipment.loadId));

  res.json(GetShipmentResponse.parse(mapShipment(shipment, events, driver, load)));
});

export default router;
