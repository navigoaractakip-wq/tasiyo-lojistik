import { Router, type IRouter } from "express";
import type { Request } from "express";
import { db, supportTicketsTable, userSessionsTable, usersTable, loadsTable } from "@workspace/db";
import { eq, and, gt, desc, or } from "drizzle-orm";

async function requireAuth(req: Request): Promise<{ id: number; role: string; name: string } | null> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const now = new Date();
  const [session] = await db
    .select()
    .from(userSessionsTable)
    .where(and(eq(userSessionsTable.token, token), gt(userSessionsTable.expiresAt, now)));
  if (!session) return null;
  const [user] = await db
    .select({ id: usersTable.id, role: usersTable.role, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));
  if (!user) return null;
  return { id: user.id, role: user.role, name: user.name };
}

const router: IRouter = Router();

// POST /support/tickets
// category="technical" → goes to admin
// category="listing"   → goes to load owner (targetUserId = load.postedById)
router.post("/support/tickets", async (req, res) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "Yetkisiz erişim" });

  const { subject, category, priority, message, loadId } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: "Konu ve mesaj zorunludur" });
  }

  let targetUserId: number | null = null;
  let resolvedLoadId: number | null = null;
  let loadTitle: string | null = null;

  if (category === "listing") {
    if (!loadId) {
      return res.status(400).json({ error: "İlan seçimi zorunludur." });
    }
    const lid = parseInt(String(loadId), 10);
    if (isNaN(lid)) return res.status(400).json({ error: "Geçersiz ilan ID." });

    const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, lid));
    if (!load) return res.status(404).json({ error: "İlan bulunamadı." });
    if (!load.postedById) return res.status(400).json({ error: "Bu ilanın sahibi bulunamadı." });

    targetUserId = load.postedById;
    resolvedLoadId = load.id;
    loadTitle = load.title;
  }

  const [ticket] = await db
    .insert(supportTicketsTable)
    .values({
      userId: user.id,
      subject: String(subject).slice(0, 200),
      category: category ?? "technical",
      priority: priority ?? "normal",
      message: String(message).slice(0, 5000),
      status: "open",
      targetUserId,
      loadId: resolvedLoadId,
      loadTitle,
    })
    .returning();

  return res.status(201).json(ticket);
});

// GET /support/tickets
// Admin  → sees only "technical" category tickets (not load-owner DMs)
// Corporate → sees their own tickets + tickets addressed to them as load owners
// Driver → sees their own submitted tickets
router.get("/support/tickets", async (req, res) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "Yetkisiz erişim" });

  const allUsers = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role }).from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  if (user.role === "admin") {
    // Admin sees only technical-category tickets (not listing DMs)
    const allTickets = await db
      .select()
      .from(supportTicketsTable)
      .orderBy(desc(supportTicketsTable.createdAt));

    const tickets = allTickets
      .filter(t => t.category !== "listing")
      .map(t => ({
        ...t,
        userName: userMap.get(t.userId)?.name ?? null,
        userEmail: userMap.get(t.userId)?.email ?? null,
        userRole: userMap.get(t.userId)?.role ?? null,
      }));

    return res.json(tickets);
  }

  if (user.role === "corporate") {
    // Corporate sees their own tickets + listing tickets addressed to them
    const allTickets = await db
      .select()
      .from(supportTicketsTable)
      .orderBy(desc(supportTicketsTable.createdAt));

    const tickets = allTickets
      .filter(t => t.userId === user.id || t.targetUserId === user.id)
      .map(t => ({
        ...t,
        senderName: userMap.get(t.userId)?.name ?? null,
        senderRole: userMap.get(t.userId)?.role ?? null,
        isIncoming: t.targetUserId === user.id && t.userId !== user.id,
      }));

    return res.json(tickets);
  }

  // Driver / individual — own tickets only
  const tickets = await db
    .select()
    .from(supportTicketsTable)
    .where(eq(supportTicketsTable.userId, user.id))
    .orderBy(desc(supportTicketsTable.createdAt));

  return res.json(tickets);
});

// GET /support/tickets/:id
router.get("/support/tickets/:id", async (req, res) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "Yetkisiz erişim" });

  const id = Number(req.params.id);
  const [ticket] = await db
    .select()
    .from(supportTicketsTable)
    .where(eq(supportTicketsTable.id, id));

  if (!ticket) return res.status(404).json({ error: "Talep bulunamadı" });

  const canAccess =
    user.role === "admin" ||
    ticket.userId === user.id ||
    ticket.targetUserId === user.id;

  if (!canAccess) return res.status(403).json({ error: "Bu talebe erişim yetkiniz yok" });

  const sender = await db.select({ name: usersTable.name, email: usersTable.email, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, ticket.userId));

  return res.json({
    ...ticket,
    userName: sender[0]?.name ?? null,
    userEmail: sender[0]?.email ?? null,
    userRole: sender[0]?.role ?? null,
  });
});

// PATCH /support/tickets/:id
// Admin: can reply + change status (for technical tickets)
// Corporate: can reply to listing tickets addressed to them
// Driver: can only close their own ticket
router.patch("/support/tickets/:id", async (req, res) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "Yetkisiz erişim" });

  const id = Number(req.params.id);
  const [ticket] = await db
    .select()
    .from(supportTicketsTable)
    .where(eq(supportTicketsTable.id, id));

  if (!ticket) return res.status(404).json({ error: "Talep bulunamadı" });

  // Admin can reply to technical tickets
  if (user.role === "admin") {
    const { adminReply, status } = req.body;
    const updates: Partial<typeof supportTicketsTable.$inferInsert> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (adminReply !== undefined) {
      updates.adminReply = String(adminReply).slice(0, 5000);
      updates.adminId = user.id;
      updates.repliedAt = new Date();
      if (!status) updates.status = "in_progress";
    }
    const [updated] = await db.update(supportTicketsTable).set(updates).where(eq(supportTicketsTable.id, id)).returning();
    return res.json(updated);
  }

  // Corporate can reply to listing tickets where they are the target
  if (user.role === "corporate" && ticket.targetUserId === user.id) {
    const { adminReply, status } = req.body;
    const updates: Partial<typeof supportTicketsTable.$inferInsert> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (adminReply !== undefined) {
      updates.adminReply = String(adminReply).slice(0, 5000);
      updates.adminId = user.id;
      updates.repliedAt = new Date();
      if (!status) updates.status = "in_progress";
    }
    const [updated] = await db.update(supportTicketsTable).set(updates).where(eq(supportTicketsTable.id, id)).returning();
    return res.json(updated);
  }

  // Ticket owner can close their ticket
  if (ticket.userId === user.id) {
    const { status } = req.body;
    if (status === "closed") {
      const [updated] = await db
        .update(supportTicketsTable)
        .set({ status: "closed", updatedAt: new Date() })
        .where(eq(supportTicketsTable.id, id))
        .returning();
      return res.json(updated);
    }
  }

  return res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
});

// GET /support/stats — admin only
router.get("/support/stats", async (req, res) => {
  const user = await requireAuth(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Yetkisiz erişim" });

  const tickets = await db
    .select({ status: supportTicketsTable.status, category: supportTicketsTable.category })
    .from(supportTicketsTable)
    .where(and());

  const technical = tickets.filter(t => t.category !== "listing");
  const total = technical.length;
  const open = technical.filter(t => t.status === "open").length;
  const inProgress = technical.filter(t => t.status === "in_progress").length;
  const resolved = technical.filter(t => t.status === "resolved").length;
  const closed = technical.filter(t => t.status === "closed").length;

  return res.json({ total, open, inProgress, resolved, closed });
});

// GET /support/my-loads — returns driver's loads they've offered on (for listing ticket form)
router.get("/support/my-loads", async (req, res) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "Yetkisiz erişim" });

  // Return active loads the driver can ask about (all active loads with an owner)
  const loads = await db
    .select({
      id: loadsTable.id,
      title: loadsTable.title,
      origin: loadsTable.origin,
      destination: loadsTable.destination,
      status: loadsTable.status,
      postedById: loadsTable.postedById,
    })
    .from(loadsTable)
    .where(eq(loadsTable.status, "active"))
    .orderBy(desc(loadsTable.createdAt))
    .limit(50);

  return res.json(loads.filter(l => l.postedById !== null));
});

export default router;
