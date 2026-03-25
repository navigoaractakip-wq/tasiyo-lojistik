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
  // Step 1: check if the target email already exists (possibly as a non-admin)
  const [targetUser] = await db
    .select({ id: usersTable.id, role: usersTable.role, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.email, ADMIN_EMAIL))
    .limit(1);

  if (targetUser) {
    if (targetUser.role === "admin") {
      logger.info({ id: targetUser.id }, "Admin kullanıcısı zaten mevcut");
      return;
    }
    // Target email exists but has a different role — promote to admin
    await db
      .update(usersTable)
      .set({ role: "admin", status: "active", name: "Süper Yönetici" })
      .where(eq(usersTable.id, targetUser.id));
    logger.info(`${ADMIN_EMAIL} kullanıcısı admin'e yükseltildi (önceki rol: ${targetUser.role})`);
    return;
  }

  // Step 2: target email doesn't exist — find any existing admin and update their email
  const [existingAdmin] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"))
    .limit(1);

  if (!existingAdmin) {
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
  } else {
    await db
      .update(usersTable)
      .set({ email: ADMIN_EMAIL })
      .where(eq(usersTable.id, existingAdmin.id));
    logger.info(`Admin e-postası güncellendi: ${existingAdmin.email} → ${ADMIN_EMAIL}`);
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
