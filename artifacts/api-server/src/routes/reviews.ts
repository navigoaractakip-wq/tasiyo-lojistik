import { Router, type IRouter } from "express";
import { db, usersTable, offersTable, driverReviewsTable } from "@workspace/db";
import { eq, avg, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth-middleware";

const router: IRouter = Router();

// POST /offers/:id/review — Kurumsal kullanıcı kabul ettiği teklife puan verir
router.post("/offers/:id/review", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const offerId = parseInt(req.params.id, 10);
  if (isNaN(offerId)) {
    res.status(400).json({ error: "Geçersiz teklif ID" });
    return;
  }

  const { rating, comment } = req.body;
  const parsedRating = Number(rating);
  if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
    res.status(400).json({ error: "Puan 1 ile 5 arasında olmalıdır" });
    return;
  }

  // Teklifi bul
  const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, offerId));
  if (!offer) {
    res.status(404).json({ error: "Teklif bulunamadı" });
    return;
  }

  // Sadece kabul edilmiş teklifler puanlanabilir
  if (offer.status !== "accepted") {
    res.status(400).json({ error: "Yalnızca kabul edilmiş teklifler puanlanabilir" });
    return;
  }

  // Sadece ilanı veren kurumsal kullanıcı puanlayabilir
  const [poster] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!poster || (poster.role !== "corporate" && poster.role !== "admin")) {
    res.status(403).json({ error: "Yalnızca kurumsal üyeler sürücüleri puanlayabilir" });
    return;
  }

  // Daha önce bu teklif için puan verilmiş mi?
  const [existing] = await db
    .select()
    .from(driverReviewsTable)
    .where(and(eq(driverReviewsTable.offerId, offerId), eq(driverReviewsTable.corporateId, req.userId!)));
  if (existing) {
    res.status(409).json({ error: "Bu teklif için zaten puan verdiniz" });
    return;
  }

  // Puanı kaydet
  await db.insert(driverReviewsTable).values({
    offerId,
    driverId: offer.driverId!,
    corporateId: req.userId!,
    rating: parsedRating,
    comment: typeof comment === "string" ? comment.trim() || null : null,
  });

  // Sürücünün ortalama puanını güncelle
  const avgResult = await db
    .select({ avg: avg(driverReviewsTable.rating) })
    .from(driverReviewsTable)
    .where(eq(driverReviewsTable.driverId, offer.driverId!));

  const newAvg = Number(avgResult[0]?.avg ?? parsedRating);

  await db
    .update(usersTable)
    .set({ rating: Math.round(newAvg * 10) / 10 })
    .where(eq(usersTable.id, offer.driverId!));

  res.json({
    success: true,
    newRating: Math.round(newAvg * 10) / 10,
    message: "Puanınız başarıyla kaydedildi",
  });
});

// GET /offers/:id/review — Bu teklif için puan verildi mi?
router.get("/offers/:id/review", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const offerId = parseInt(req.params.id, 10);
  if (isNaN(offerId)) {
    res.status(400).json({ error: "Geçersiz teklif ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(driverReviewsTable)
    .where(and(eq(driverReviewsTable.offerId, offerId), eq(driverReviewsTable.corporateId, req.userId!)));

  res.json({
    reviewed: !!existing,
    review: existing
      ? {
          rating: existing.rating,
          comment: existing.comment,
          createdAt: existing.createdAt,
        }
      : null,
  });
});

// GET /users/:id/reviews — Sürücünün aldığı tüm puanlar
router.get("/users/:id/reviews", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Geçersiz kullanıcı ID" });
    return;
  }

  const reviews = await db
    .select()
    .from(driverReviewsTable)
    .where(eq(driverReviewsTable.driverId, userId));

  const corporateIds = [...new Set(reviews.map(r => r.corporateId))];
  let corporateMap = new Map<number, { name: string; company: string | null; avatarUrl: string | null }>();
  if (corporateIds.length > 0) {
    const corps = await db.select().from(usersTable).where(eq(usersTable.role, "corporate"));
    corps.forEach(c => corporateMap.set(c.id, { name: c.name, company: c.company, avatarUrl: c.avatarUrl }));
  }

  res.json({
    reviews: reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      corporate: corporateMap.get(r.corporateId) ?? null,
    })),
    total: reviews.length,
    average: reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : null,
  });
});

export default router;
