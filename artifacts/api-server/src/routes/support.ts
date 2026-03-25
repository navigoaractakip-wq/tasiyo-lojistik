import { Router, type IRouter } from "express";
import type { Request } from "express";
import { db, supportTicketsTable, userSessionsTable, usersTable } from "@workspace/db";
import { eq, and, gt, desc } from "drizzle-orm";

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

router.post("/support/tickets", async (req, res) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "Yetkisiz erişim" });

  const { subject, category, priority, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: "Konu ve mesaj zorunludur" });
  }

  const [ticket] = await db
    .insert(supportTicketsTable)
    .values({
      userId: user.id,
      subject: String(subject).slice(0, 200),
      category: category ?? "general",
      priority: priority ?? "normal",
      message: String(message).slice(0, 5000),
      status: "open",
    })
    .returning();

  return res.status(201).json(ticket);
});

router.get("/support/tickets", async (req, res) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "Yetkisiz erişim" });

  if (user.role === "admin") {
    const tickets = await db
      .select({
        id: supportTicketsTable.id,
        userId: supportTicketsTable.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userRole: usersTable.role,
        subject: supportTicketsTable.subject,
        category: supportTicketsTable.category,
        priority: supportTicketsTable.priority,
        status: supportTicketsTable.status,
        adminReply: supportTicketsTable.adminReply,
        repliedAt: supportTicketsTable.repliedAt,
        createdAt: supportTicketsTable.createdAt,
        updatedAt: supportTicketsTable.updatedAt,
      })
      .from(supportTicketsTable)
      .leftJoin(usersTable, eq(supportTicketsTable.userId, usersTable.id))
      .orderBy(desc(supportTicketsTable.createdAt));
    return res.json(tickets);
  }

  const tickets = await db
    .select()
    .from(supportTicketsTable)
    .where(eq(supportTicketsTable.userId, user.id))
    .orderBy(desc(supportTicketsTable.createdAt));

  return res.json(tickets);
});

router.get("/support/tickets/:id", async (req, res) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "Yetkisiz erişim" });

  const id = Number(req.params.id);

  const [ticket] = await db
    .select({
      id: supportTicketsTable.id,
      userId: supportTicketsTable.userId,
      userName: usersTable.name,
      userEmail: usersTable.email,
      userRole: usersTable.role,
      subject: supportTicketsTable.subject,
      category: supportTicketsTable.category,
      priority: supportTicketsTable.priority,
      message: supportTicketsTable.message,
      status: supportTicketsTable.status,
      adminReply: supportTicketsTable.adminReply,
      repliedAt: supportTicketsTable.repliedAt,
      createdAt: supportTicketsTable.createdAt,
      updatedAt: supportTicketsTable.updatedAt,
    })
    .from(supportTicketsTable)
    .leftJoin(usersTable, eq(supportTicketsTable.userId, usersTable.id))
    .where(eq(supportTicketsTable.id, id));

  if (!ticket) return res.status(404).json({ error: "Talep bulunamadı" });
  if (user.role !== "admin" && ticket.userId !== user.id) {
    return res.status(403).json({ error: "Bu talebe erişim yetkiniz yok" });
  }

  return res.json(ticket);
});

router.patch("/support/tickets/:id", async (req, res) => {
  const user = await requireAuth(req);
  if (!user) return res.status(401).json({ error: "Yetkisiz erişim" });

  const id = Number(req.params.id);

  const [ticket] = await db
    .select()
    .from(supportTicketsTable)
    .where(eq(supportTicketsTable.id, id));

  if (!ticket) return res.status(404).json({ error: "Talep bulunamadı" });

  if (user.role === "admin") {
    const { adminReply, status } = req.body;
    const updates: Partial<typeof supportTicketsTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (status) updates.status = status;
    if (adminReply !== undefined) {
      updates.adminReply = String(adminReply).slice(0, 5000);
      updates.adminId = user.id;
      updates.repliedAt = new Date();
      if (!status) updates.status = "in_progress";
    }
    const [updated] = await db
      .update(supportTicketsTable)
      .set(updates)
      .where(eq(supportTicketsTable.id, id))
      .returning();
    return res.json(updated);
  }

  if (ticket.userId !== user.id) {
    return res.status(403).json({ error: "Bu talebe erişim yetkiniz yok" });
  }
  const { status } = req.body;
  if (status && status === "closed") {
    const [updated] = await db
      .update(supportTicketsTable)
      .set({ status: "closed", updatedAt: new Date() })
      .where(eq(supportTicketsTable.id, id))
      .returning();
    return res.json(updated);
  }

  return res.status(400).json({ error: "Geçersiz işlem" });
});

router.get("/support/stats", async (req, res) => {
  const user = await requireAuth(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Yetkisiz erişim" });

  const tickets = await db.select({ status: supportTicketsTable.status }).from(supportTicketsTable);
  const total = tickets.length;
  const open = tickets.filter(t => t.status === "open").length;
  const inProgress = tickets.filter(t => t.status === "in_progress").length;
  const resolved = tickets.filter(t => t.status === "resolved").length;
  const closed = tickets.filter(t => t.status === "closed").length;

  return res.json({ total, open, inProgress, resolved, closed });
});

export default router;
