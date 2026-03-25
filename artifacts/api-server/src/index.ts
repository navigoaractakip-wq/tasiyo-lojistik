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

const ADMIN_EMAIL = "navigoaractakip@gmail.com";

async function seedAdminUser() {
  const existing = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(usersTable).values({
      name: "Süper Yönetici",
      email: ADMIN_EMAIL,
      phone: "+90 532 000 0000",
      role: "admin",
      status: "active",
      company: "TaşıYo Lojistik",
      rating: 5.0,
      totalShipments: 0,
    });
    logger.info(`Admin kullanıcısı oluşturuldu: ${ADMIN_EMAIL}`);
  } else if (existing[0].email !== ADMIN_EMAIL) {
    await db
      .update(usersTable)
      .set({ email: ADMIN_EMAIL })
      .where(eq(usersTable.id, existing[0].id));
    logger.info(`Admin e-postası güncellendi: ${existing[0].email} → ${ADMIN_EMAIL}`);
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
