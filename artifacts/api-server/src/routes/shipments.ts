import { Router, type IRouter } from "express";
import { db, shipmentsTable, shipmentEventsTable, loadsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListShipmentsResponse, GetShipmentResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function mapShipment(
  shipment: typeof shipmentsTable.$inferSelect,
  events: (typeof shipmentEventsTable.$inferSelect)[],
  driver?: typeof usersTable.$inferSelect | null,
  load?: typeof loadsTable.$inferSelect | null
) {
  return {
    id: String(shipment.id),
    loadId: String(shipment.loadId),
    status: shipment.status as "pickup" | "in_transit" | "delivered" | "cancelled",
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
  const { status } = req.query;
  const allShipments = await db.select().from(shipmentsTable).orderBy(shipmentsTable.createdAt);
  const filtered = status && typeof status === "string"
    ? allShipments.filter((s) => s.status === status)
    : allShipments;

  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const allLoads = await db.select().from(loadsTable);
  const loadMap = new Map(allLoads.map((l) => [l.id, l]));
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
