import { Router, type IRouter } from "express";
import { db, usersTable, loadsTable, shipmentsTable, offersTable } from "@workspace/db";
import { GetAdminStatsResponse } from "@workspace/api-zod";
import { eq, and, gte, lt, sql } from "drizzle-orm";

const router: IRouter = Router();

const TR_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function getLast6Months(): { label: string; year: number; month: number }[] {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ label: TR_MONTHS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() });
  }
  return result;
}

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [users, loads, shipments, offers] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(loadsTable),
    db.select().from(shipmentsTable),
    db.select().from(offersTable),
  ]);

  // ── Kullanıcı metrikleri ──
  const totalUsers = users.filter((u) => u.role !== "admin").length;
  const activeUsers = users.filter((u) => u.role !== "admin" && u.status === "active").length;
  const pendingApprovals =
    users.filter((u) => u.status === "pending").length +
    loads.filter((l) => l.status === "pending").length;

  // ── Yük / İlan metrikleri ──
  const totalLoads = loads.length;
  const activeLoads = loads.filter((l) => l.status === "active").length;

  // ── Sevkiyat metrikleri ──
  const totalShipments = shipments.length;
  const completedShipments = shipments.filter((s) => s.status === "delivered").length;

  // ── Aktif araç sayısı: tamamlanmamış sevkiyatı olan şoför sayısı ──
  const activeShipmentDriverIds = new Set(
    shipments
      .filter((s) => s.status !== "delivered" && s.status !== "cancelled" && s.driverId)
      .map((s) => s.driverId)
  );
  const activeVehicles = activeShipmentDriverIds.size;

  // ── Gelir hesabı ──
  // Kabul edilmiş teklifler (accepted)
  const acceptedOffers = offers.filter((o) => o.status === "accepted");
  const acceptedRevenue = acceptedOffers.reduce((sum, o) => sum + (o.amount ?? 0), 0);

  // Tamamlanmış yükler (fixed fiyatlı, completed/assigned)
  const completedLoadRevenue = loads
    .filter((l) => l.pricingModel === "fixed" && (l.status === "completed" || l.status === "assigned") && l.price)
    .reduce((sum, l) => sum + (l.price ?? 0), 0);

  const totalRevenue = Math.round(acceptedRevenue + completedLoadRevenue);

  // Bu ayki gelir
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = Math.round(
    acceptedOffers
      .filter((o) => new Date(o.createdAt) >= monthStart)
      .reduce((sum, o) => sum + (o.amount ?? 0), 0) +
    loads
      .filter((l) => l.pricingModel === "fixed" && l.price && new Date(l.createdAt) >= monthStart && (l.status === "completed" || l.status === "assigned"))
      .reduce((sum, l) => sum + (l.price ?? 0), 0)
  );

  // ── Son 6 aylık gelir grafiği ──
  const months = getLast6Months();
  const revenueChart = months.map(({ label, year, month }) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);

    const offerRev = acceptedOffers
      .filter((o) => { const d = new Date(o.createdAt); return d >= start && d < end; })
      .reduce((sum, o) => sum + (o.amount ?? 0), 0);

    const loadRev = loads
      .filter((l) => {
        if (!l.price || l.pricingModel !== "fixed") return false;
        if (l.status !== "completed" && l.status !== "assigned") return false;
        const d = new Date(l.createdAt);
        return d >= start && d < end;
      })
      .reduce((sum, l) => sum + (l.price ?? 0), 0);

    return { label, value: Math.round(offerRev + loadRev) };
  });

  // ── Son 6 aylık sevkiyat grafiği ──
  const shipmentsChart = months.map(({ label, year, month }) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    const count = shipments.filter((s) => {
      const d = new Date(s.createdAt);
      return d >= start && d < end;
    }).length;
    return { label, value: count };
  });

  // ── Kullanıcı rol dağılımı ──
  const driverCount = users.filter((u) => u.role === "driver").length;
  const corporateCount = users.filter((u) => u.role === "corporate").length;
  const individualCount = users.filter((u) => u.role === "individual").length;

  // ── Son 7 günde yeni kayıt ──
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsersThisWeek = users.filter((u) => new Date(u.createdAt) >= sevenDaysAgo && u.role !== "admin").length;
  const newLoadsThisWeek = loads.filter((l) => new Date(l.createdAt) >= sevenDaysAgo).length;

  const stats = {
    totalUsers,
    activeUsers,
    totalLoads,
    activeLoads,
    totalShipments,
    completedShipments,
    totalRevenue,
    monthlyRevenue,
    pendingApprovals,
    activeVehicles,
    revenueChart,
    shipmentsChart,
    driverCount,
    corporateCount,
    individualCount,
    newUsersThisWeek,
    newLoadsThisWeek,
  };

  res.json(GetAdminStatsResponse.parse(stats));
});

export default router;
