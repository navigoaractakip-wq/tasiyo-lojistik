import { Router, type IRouter } from "express";
import { db, usersTable, loadsTable, shipmentsTable } from "@workspace/db";
import { GetAdminStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  const loads = await db.select().from(loadsTable);
  const shipments = await db.select().from(shipmentsTable);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === "active").length,
    totalLoads: loads.length,
    activeLoads: loads.filter((l) => l.status === "active").length,
    totalShipments: shipments.length,
    completedShipments: shipments.filter((s) => s.status === "delivered").length,
    totalRevenue: 2450000,
    monthlyRevenue: 380000,
    pendingApprovals: users.filter((u) => u.status === "pending").length + loads.filter((l) => l.status === "pending").length,
    activeVehicles: 47,
    revenueChart: [
      { label: "Oca", value: 280000 },
      { label: "Şub", value: 320000 },
      { label: "Mar", value: 380000 },
      { label: "Nis", value: 350000 },
      { label: "May", value: 420000 },
      { label: "Haz", value: 390000 },
    ],
    shipmentsChart: [
      { label: "Oca", value: 120 },
      { label: "Şub", value: 145 },
      { label: "Mar", value: 162 },
      { label: "Nis", value: 138 },
      { label: "May", value: 175 },
      { label: "Haz", value: 168 },
    ],
  };

  res.json(GetAdminStatsResponse.parse(stats));
});

export default router;
