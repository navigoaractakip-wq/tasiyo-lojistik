import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedAdminUser() {
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(usersTable).values({
      name: "Süper Yönetici",
      email: "admin@tasiyo.com",
      phone: "+90 532 000 0000",
      role: "admin",
      status: "active",
      company: "TaşıYo Lojistik",
      rating: 5.0,
      totalShipments: 0,
    });
    logger.info("Admin kullanıcısı oluşturuldu: admin@tasiyo.com");
  } else {
    logger.info({ id: existing[0].id }, "Admin kullanıcısı zaten mevcut");
  }
}

const server = app.listen(port, () => {
  logger.info({ port }, "Server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});

server.on("listening", () => {
  seedAdminUser().catch((err) => {
    logger.error({ err }, "Admin seed hatası");
  });
});
