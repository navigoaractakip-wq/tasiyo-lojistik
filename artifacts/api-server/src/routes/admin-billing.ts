import { Router, type IRouter } from "express";
import multer from "multer";
import { db, planConfigsTable, invoicesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth-middleware";
import { randomUUID } from "crypto";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Default plan definitions (used for seeding) ───────────────────────────────
const DEFAULT_PLANS = [
  {
    planId: "starter",
    name: "Başlangıç",
    price: 0,
    currency: "TRY",
    features: JSON.stringify(["Aylık 5 ilan", "Temel destek", "1 kullanıcı", "Standart listeleme"]),
    badge: null,
    highlighted: "false",
    sortOrder: 0,
  },
  {
    planId: "corporate",
    name: "Kurumsal",
    price: 4999,
    currency: "TRY",
    features: JSON.stringify(["Sınırsız ilan", "Öncelikli destek", "5 kullanıcı", "Öne çıkan listeleme", "Gelişmiş analitik", "API erişimi"]),
    badge: "Çok Tercih Edilen",
    highlighted: "true",
    sortOrder: 1,
  },
  {
    planId: "premium",
    name: "Premium",
    price: 9999,
    currency: "TRY",
    features: JSON.stringify(["Sınırsız ilan", "7/24 özel destek", "Sınırsız kullanıcı", "Öne çıkan listeleme", "Gelişmiş analitik", "API erişimi", "Özel entegrasyon", "Hesap yöneticisi"]),
    badge: "En Kapsamlı",
    highlighted: "false",
    sortOrder: 2,
  },
];

// ── Helper: ensure default plans exist in DB ──────────────────────────────────
export async function ensureDefaultPlans() {
  const existing = await db.select().from(planConfigsTable);
  if (existing.length === 0) {
    await db.insert(planConfigsTable).values(DEFAULT_PLANS);
  }
}

// ── Helper: read plans from DB ────────────────────────────────────────────────
export async function getPlansFromDb() {
  await ensureDefaultPlans();
  const rows = await db.select().from(planConfigsTable).orderBy(planConfigsTable.sortOrder);
  return rows.map(r => ({
    id: r.planId,
    name: r.name,
    price: r.price,
    currency: r.currency,
    interval: "monthly",
    features: JSON.parse(r.features) as string[],
    badge: r.badge,
    highlighted: r.highlighted === "true",
    sortOrder: r.sortOrder,
  }));
}

// ── Middleware: require admin role ────────────────────────────────────────────
function requireAdmin(req: AuthRequest, res: any, next: any) {
  if (req.userRole !== "admin") {
    res.status(403).json({ error: "Yetkisiz." });
    return;
  }
  next();
}

// ── GET /admin/plans ──────────────────────────────────────────────────────────
router.get("/admin/plans", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "admin") { res.status(403).json({ error: "Yetkisiz." }); return; }
  const plans = await getPlansFromDb();
  res.json({ plans });
});

// ── PUT /admin/plans/:planId ──────────────────────────────────────────────────
router.put("/admin/plans/:planId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "admin") { res.status(403).json({ error: "Yetkisiz." }); return; }

  const { planId } = req.params;
  const { name, price, features, badge, highlighted, sortOrder } = req.body;

  await ensureDefaultPlans();

  const [existing] = await db.select().from(planConfigsTable).where(eq(planConfigsTable.planId, planId)).limit(1);

  if (!existing) {
    res.status(404).json({ error: "Plan bulunamadı." });
    return;
  }

  await db.update(planConfigsTable)
    .set({
      name: name ?? existing.name,
      price: price !== undefined ? Number(price) : existing.price,
      features: features ? JSON.stringify(features) : existing.features,
      badge: badge !== undefined ? (badge || null) : existing.badge,
      highlighted: highlighted !== undefined ? String(highlighted) : existing.highlighted,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : existing.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(planConfigsTable.planId, planId));

  const plans = await getPlansFromDb();
  res.json({ success: true, plans });
});

// ── GET /admin/invoices ───────────────────────────────────────────────────────
router.get("/admin/invoices", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "admin") { res.status(403).json({ error: "Yetkisiz." }); return; }

  const { userId } = req.query;

  const rows = await db.select({
    id: invoicesTable.id,
    userId: invoicesTable.userId,
    invoiceNo: invoicesTable.invoiceNo,
    amount: invoicesTable.amount,
    currency: invoicesTable.currency,
    description: invoicesTable.description,
    filename: invoicesTable.filename,
    originalName: invoicesTable.originalName,
    mimeType: invoicesTable.mimeType,
    fileSize: invoicesTable.fileSize,
    uploadedAt: invoicesTable.uploadedAt,
    transactionId: invoicesTable.transactionId,
    userName: usersTable.name,
    userEmail: usersTable.email,
  })
    .from(invoicesTable)
    .leftJoin(usersTable, eq(invoicesTable.userId, usersTable.id))
    .where(userId ? eq(invoicesTable.userId, Number(userId)) : undefined)
    .orderBy(desc(invoicesTable.uploadedAt));

  res.json({ invoices: rows });
});

// ── POST /admin/invoices ──────────────────────────────────────────────────────
router.post("/admin/invoices", requireAuth, upload.single("file"), async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "admin") { res.status(403).json({ error: "Yetkisiz." }); return; }

  const { userId, invoiceNo, amount, description, transactionId } = req.body;
  const file = req.file;

  if (!userId || !file) {
    res.status(400).json({ error: "Kullanıcı ve dosya zorunludur." });
    return;
  }

  // Validate user exists
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(userId))).limit(1);
  if (!user) {
    res.status(404).json({ error: "Kullanıcı bulunamadı." });
    return;
  }

  const fileData = file.buffer.toString("base64");
  const filename = `invoice_${Date.now()}_${randomUUID().slice(0, 8)}.pdf`;

  const [invoice] = await db.insert(invoicesTable).values({
    userId: Number(userId),
    transactionId: transactionId ? Number(transactionId) : null,
    invoiceNo: invoiceNo || `FAT-${Date.now()}`,
    amount: amount ? Number(amount) : null,
    currency: "TRY",
    description: description || null,
    filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    fileData,
    uploadedBy: req.userId,
  }).returning();

  res.json({ success: true, invoice: { ...invoice, fileData: undefined } });
});

// ── DELETE /admin/invoices/:id ────────────────────────────────────────────────
router.delete("/admin/invoices/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (req.userRole !== "admin") { res.status(403).json({ error: "Yetkisiz." }); return; }

  const { id } = req.params;
  await db.delete(invoicesTable).where(eq(invoicesTable.id, Number(id)));
  res.json({ success: true });
});

// ── GET /payment/invoices (user's own invoices) ───────────────────────────────
router.get("/payment/invoices", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;

  const rows = await db.select({
    id: invoicesTable.id,
    invoiceNo: invoicesTable.invoiceNo,
    amount: invoicesTable.amount,
    currency: invoicesTable.currency,
    description: invoicesTable.description,
    originalName: invoicesTable.originalName,
    mimeType: invoicesTable.mimeType,
    fileSize: invoicesTable.fileSize,
    uploadedAt: invoicesTable.uploadedAt,
    transactionId: invoicesTable.transactionId,
  })
    .from(invoicesTable)
    .where(eq(invoicesTable.userId, userId))
    .orderBy(desc(invoicesTable.uploadedAt));

  res.json({ invoices: rows });
});

// ── GET /payment/invoices/:id/download ────────────────────────────────────────
router.get("/payment/invoices/:id/download", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const invoiceId = Number(req.params.id);

  const [invoice] = await db.select()
    .from(invoicesTable)
    .where(
      req.userRole === "admin"
        ? eq(invoicesTable.id, invoiceId)
        : and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.userId, userId))
    )
    .limit(1);

  if (!invoice) {
    res.status(404).json({ error: "Fatura bulunamadı." });
    return;
  }

  const buffer = Buffer.from(invoice.fileData, "base64");
  res.setHeader("Content-Type", invoice.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(invoice.originalName)}"`);
  res.setHeader("Content-Length", buffer.length);
  res.send(buffer);
});

export default router;
