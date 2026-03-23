import { Router, type IRouter } from "express";
import { ListVehiclesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/vehicles", async (_req, res): Promise<void> => {
  const vehicles = [
    {
      id: "v1", driverId: "2", vehicleType: "Tır", plateNumber: "34 ABC 123",
      lat: 39.93, lng: 32.86, isAvailable: true, eta: 12, rating: 4.8,
      driver: { id: "2", name: "Mehmet Yılmaz", email: "mehmet@example.com", role: "driver" as const, status: "active" as const, rating: 4.8, createdAt: new Date() }
    },
    {
      id: "v2", driverId: "3", vehicleType: "Kamyon", plateNumber: "06 DEF 456",
      lat: 39.95, lng: 32.84, isAvailable: true, eta: 8, rating: 4.5,
      driver: { id: "3", name: "Ali Kaya", email: "ali@example.com", role: "driver" as const, status: "active" as const, rating: 4.5, createdAt: new Date() }
    },
    {
      id: "v3", driverId: "4", vehicleType: "Van", plateNumber: "35 GHI 789",
      lat: 39.91, lng: 32.88, isAvailable: false, eta: 25, rating: 4.2,
      driver: { id: "4", name: "Hasan Demir", email: "hasan@example.com", role: "driver" as const, status: "active" as const, rating: 4.2, createdAt: new Date() }
    },
    {
      id: "v4", driverId: "5", vehicleType: "Frigorifik", plateNumber: "16 JKL 012",
      lat: 39.97, lng: 32.82, isAvailable: true, eta: 18, rating: 4.9,
      driver: { id: "5", name: "Fatma Şahin", email: "fatma@example.com", role: "driver" as const, status: "active" as const, rating: 4.9, createdAt: new Date() }
    },
  ];

  res.json(ListVehiclesResponse.parse({ vehicles, total: vehicles.length }));
});

export default router;
