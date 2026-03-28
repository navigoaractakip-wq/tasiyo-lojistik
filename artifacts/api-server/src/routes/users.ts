import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  userSessionsTable,
  userConsentsTable,
  notificationsTable,
  supportTicketsTable,
  conversationParticipantsTable,
  messagesTable,
  loadsTable,
  offersTable,
  shipmentsTable,
  shipmentEventsTable,
} from "@workspace/db";
import { eq, or } from "drizzle-orm";
import {
  ListUsersResponse,
  CreateUserBody,
  GetUserResponse,
  UpdateUserBody,
  UpdateUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const { role, status } = req.query;
  let query = db.select().from(usersTable).$dynamic();

  if (role && typeof role === "string") {
    query = query.where(eq(usersTable.role, role));
  }

  const users = await query.orderBy(usersTable.createdAt);
  const filtered = status && typeof status === "string"
    ? users.filter((u) => u.status === status)
    : users;

  const mapped = filtered.map((u) => ({
    id: String(u.id),
    name: u.name,
    email: u.email,
    phone: u.phone ?? undefined,
    role: u.role as "admin" | "corporate" | "individual" | "driver",
    status: u.status as "active" | "suspended" | "pending",
    company: u.company ?? undefined,
    avatarUrl: u.avatarUrl ?? undefined,
    rating: u.rating ?? undefined,
    totalShipments: u.totalShipments ?? undefined,
    createdAt: u.createdAt,
  }));

  res.json(
    ListUsersResponse.parse({
      users: mapped,
      total: mapped.length,
      page: 1,
      pageSize: mapped.length,
    })
  );
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, phone, role, company } = parsed.data;
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, phone: phone ?? null, role: role ?? "individual", company: company ?? null })
    .returning();

  res.status(201).json(
    GetUserResponse.parse({
      id: String(user.id),
      name: user.name,
      email: user.email,
      phone: user.phone ?? undefined,
      role: user.role as "admin" | "corporate" | "individual" | "driver",
      status: user.status as "active" | "suspended" | "pending",
      company: user.company ?? undefined,
      createdAt: user.createdAt,
    })
  );
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(
    GetUserResponse.parse({
      id: String(user.id),
      name: user.name,
      email: user.email,
      phone: user.phone ?? undefined,
      role: user.role as "admin" | "corporate" | "individual" | "driver",
      status: user.status as "active" | "suspended" | "pending",
      company: user.company ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      website: user.website ?? undefined,
      address: user.address ?? undefined,
      taxNumber: user.taxNumber ?? undefined,
      vehicleTypes: user.vehicleTypes ?? undefined,
      vehiclePlate: user.vehiclePlate ?? undefined,
      isPhoneVerified: user.isPhoneVerified ?? false,
      notificationSettings: user.notificationSettings ?? undefined,
      rating: user.rating ?? undefined,
      totalShipments: user.totalShipments ?? undefined,
      createdAt: user.createdAt,
    })
  );
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.company !== undefined) updates.company = parsed.data.company;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;
  if (parsed.data.website !== undefined) updates.website = parsed.data.website;
  if (parsed.data.address !== undefined) updates.address = parsed.data.address;
  if (parsed.data.taxNumber !== undefined) updates.taxNumber = parsed.data.taxNumber;
  if (parsed.data.vehicleTypes !== undefined) updates.vehicleTypes = parsed.data.vehicleTypes;
  if (parsed.data.vehiclePlate !== undefined) updates.vehiclePlate = parsed.data.vehiclePlate;
  if (parsed.data.notificationSettings !== undefined) updates.notificationSettings = parsed.data.notificationSettings;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(
    UpdateUserResponse.parse({
      id: String(user.id),
      name: user.name,
      email: user.email,
      phone: user.phone ?? undefined,
      role: user.role as "admin" | "corporate" | "individual" | "driver",
      status: user.status as "active" | "suspended" | "pending",
      company: user.company ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      website: user.website ?? undefined,
      address: user.address ?? undefined,
      taxNumber: user.taxNumber ?? undefined,
      vehicleTypes: user.vehicleTypes ?? undefined,
      vehiclePlate: user.vehiclePlate ?? undefined,
      isPhoneVerified: user.isPhoneVerified ?? false,
      notificationSettings: user.notificationSettings ?? undefined,
      createdAt: user.createdAt,
    })
  );
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [existing] = await db.select({ id: usersTable.id, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Kullanıcı bulunamadı" });
      return;
    }
    if (existing.role === "admin") {
      res.status(403).json({ error: "Yönetici hesabı silinemez" });
      return;
    }

    // 1. Kullanıcının yüklerine bağlı sevkiyat olayları, sevkiyatlar ve teklifleri sil
    const userLoads = await db.select({ id: loadsTable.id }).from(loadsTable).where(eq(loadsTable.postedById, id));
    for (const load of userLoads) {
      const loadShipments = await db.select({ id: shipmentsTable.id }).from(shipmentsTable).where(eq(shipmentsTable.loadId, load.id));
      for (const shipment of loadShipments) {
        await db.delete(shipmentEventsTable).where(eq(shipmentEventsTable.shipmentId, shipment.id));
      }
      await db.delete(shipmentsTable).where(eq(shipmentsTable.loadId, load.id));
      await db.delete(offersTable).where(eq(offersTable.loadId, load.id));
    }
    await db.delete(loadsTable).where(eq(loadsTable.postedById, id));

    // 2. Şoförün sevkiyat olayları, sevkiyatları ve teklifleri
    const driverShipments = await db.select({ id: shipmentsTable.id }).from(shipmentsTable).where(eq(shipmentsTable.driverId, id));
    for (const shipment of driverShipments) {
      await db.delete(shipmentEventsTable).where(eq(shipmentEventsTable.shipmentId, shipment.id));
    }
    await db.delete(shipmentsTable).where(eq(shipmentsTable.driverId, id));
    await db.delete(offersTable).where(eq(offersTable.driverId, id));

    // 3. Destek talepleri
    await db.delete(supportTicketsTable).where(or(
      eq(supportTicketsTable.userId, id),
      eq(supportTicketsTable.targetUserId, id),
    ));

    // 4. Bildirimler
    await db.delete(notificationsTable).where(eq(notificationsTable.userId, id));

    // 5. Konuşma katılımcıları ve mesajlar
    const userConvs = await db.select({ conversationId: conversationParticipantsTable.conversationId })
      .from(conversationParticipantsTable)
      .where(eq(conversationParticipantsTable.userId, id));
    for (const conv of userConvs) {
      await db.delete(messagesTable).where(eq(messagesTable.conversationId, conv.conversationId));
      await db.delete(conversationParticipantsTable).where(eq(conversationParticipantsTable.conversationId, conv.conversationId));
    }
    await db.delete(messagesTable).where(eq(messagesTable.senderId, id));

    // 6. Oturumlar
    await db.delete(userSessionsTable).where(eq(userSessionsTable.userId, id));

    // 7. Kullanıcı rızaları (FK kısıtlaması var!)
    await db.delete(userConsentsTable).where(eq(userConsentsTable.userId, id));

    // 8. Son olarak kullanıcıyı sil
    await db.delete(usersTable).where(eq(usersTable.id, id));

    res.json({ success: true });
  } catch (err: any) {
    console.error("Kullanıcı silme hatası:", err);
    res.status(500).json({ error: "Kullanıcı silinirken hata oluştu: " + (err?.message ?? "Bilinmeyen hata") });
  }
});

export default router;
