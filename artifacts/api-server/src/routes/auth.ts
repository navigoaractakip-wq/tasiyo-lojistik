import { Router, type IRouter } from "express";
import { randomInt } from "crypto";
import { db, otpCodesTable, userSessionsTable, usersTable, platformSettingsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendSms, sendEmail } from "../lib/notifier";
import {
  SendOtpBody,
  SendOtpResponse,
  VerifyOtpBody,
  VerifyOtpResponse,
  LogoutResponse,
  GetMeResponse,
  RegisterBody,
  RegisterResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function mapUser(u: typeof usersTable.$inferSelect) {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    phone: u.phone ?? undefined,
    role: u.role as "admin" | "corporate" | "individual" | "driver",
    status: u.status as "active" | "suspended" | "pending",
    company: u.company ?? undefined,
    avatarUrl: u.avatarUrl ?? undefined,
    rating: u.rating ?? undefined,
    totalShipments: u.totalShipments ?? undefined,
    createdAt: u.createdAt,
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Geçersiz form verisi." });
    return;
  }

  const { name, email, phone, role, company } = parsed.data;

  // Check if email already exists
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  if (existing.length > 0) {
    res.status(409).json({ success: false, message: "Bu e-posta adresi zaten kayıtlı." });
    return;
  }

  // Create user
  const [newUser] = await db
    .insert(usersTable)
    .values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      role,
      company: company?.trim() || null,
      status: "active",
    })
    .returning();

  console.log(`[REGISTER] Yeni kullanıcı oluşturuldu: ${newUser.name} (${newUser.email}) - Rol: ${newUser.role}`);

  // Auto-send OTP
  const identifier = phone?.trim() || email.toLowerCase().trim();
  const identifierType = phone?.trim() ? "phone" : "email";
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.insert(otpCodesTable).values({ identifier, identifierType, code, expiresAt });

  let channel = "console";
  if (identifierType === "phone") {
    const sent = await sendSms(identifier, `TaşıYo doğrulama kodunuz: ${code}\n\nBu kod 10 dakika geçerlidir.`);
    channel = sent ? "sms" : "console";
  } else {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #1e40af;">🚚 TaşıYo — Hesabınız Oluşturuldu!</h2>
        <p>Merhaba <strong>${name}</strong>,</p>
        <p>Hesabınız başarıyla oluşturuldu. Giriş doğrulama kodunuz:</p>
        <div style="background:#f3f4f6; border-radius:8px; padding:20px; text-align:center; margin:16px 0;">
          <span style="font-size:2.5rem; font-weight:700; letter-spacing:0.3em; color:#1e40af;">${code}</span>
        </div>
        <p style="color:#6b7280; font-size:0.9rem;">Bu kod 10 dakika geçerlidir.</p>
      </div>`;
    const sent = await sendEmail(identifier, "TaşıYo — Hesabınız Oluşturuldu", html);
    channel = sent ? "email" : "console";
  }

  if (channel === "console") {
    console.log(`\n🔐 [OTP - KAYIT] ${identifier} → KOD: ${code}\n`);
  }

  res.json(
    RegisterResponse.parse({
      success: true,
      message: channel === "console"
        ? "Hesabınız oluşturuldu. SMTP/SMS yapılandırılmadığı için kod aşağıda gösteriliyor."
        : `Doğrulama kodu ${channel === "sms" ? "telefonunuza" : "e-postanıza"} gönderildi.`,
      identifier,
      identifierType,
      devCode: channel === "console" ? code : undefined,
    })
  );
});

router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Geçersiz istek." });
    return;
  }

  const { identifier, identifierType } = parsed.data;

  // Check user exists
  const allUsers = await db.select().from(usersTable);
  const user = allUsers.find((u) =>
    identifierType === "email"
      ? u.email?.toLowerCase() === identifier.toLowerCase()
      : u.phone?.replace(/\s/g, "") === identifier.replace(/\s/g, "")
  );

  if (!user) {
    res.status(404).json({ success: false, message: "Bu bilgilere ait kullanıcı bulunamadı." });
    return;
  }

  if (user.status === "suspended") {
    res.status(403).json({ success: false, message: "Hesabınız askıya alınmış." });
    return;
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate old codes
  await db
    .update(otpCodesTable)
    .set({ isUsed: true })
    .where(
      and(
        eq(otpCodesTable.identifier, identifier),
        eq(otpCodesTable.identifierType, identifierType),
        eq(otpCodesTable.isUsed, false)
      )
    );

  await db.insert(otpCodesTable).values({
    identifier,
    identifierType,
    code,
    expiresAt,
  });

  let channel = "console";
  if (identifierType === "phone") {
    const sent = await sendSms(
      identifier,
      `TaşıYo doğrulama kodunuz: ${code}\n\nBu kod 10 dakika geçerlidir.`
    );
    channel = sent ? "sms" : "console";
  } else {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">🚚 TaşıYo Doğrulama</h2>
        <p style="color: #374151;">Giriş doğrulama kodunuz:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af; padding: 16px 0;">${code}</div>
        <p style="color: #6b7280; font-size: 14px;">Bu kod 10 dakika geçerlidir. Paylaşmayın.</p>
      </div>`;
    const sent = await sendEmail(identifier, "TaşıYo — Giriş Doğrulama Kodu", html);
    channel = sent ? "email" : "console";
  }

  if (channel === "console") {
    console.log(`\n🔐 [OTP - GİRİŞ] ${identifier} → KOD: ${code}\n`);
  }

  res.json(
    SendOtpResponse.parse({
      success: true,
      message: channel === "console"
        ? "SMTP/SMS yapılandırılmadığı için kod aşağıda gösteriliyor."
        : `Doğrulama kodu ${identifierType === "phone" ? "telefonunuza" : "e-postanıza"} gönderildi.`,
      channel,
      devCode: channel === "console" ? code : undefined,
    })
  );
});

router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Geçersiz istek." });
    return;
  }

  const { identifier, identifierType, code } = parsed.data;

  const now = new Date();
  const [otp] = await db
    .select()
    .from(otpCodesTable)
    .where(
      and(
        eq(otpCodesTable.identifier, identifier),
        eq(otpCodesTable.identifierType, identifierType),
        eq(otpCodesTable.code, code),
        eq(otpCodesTable.isUsed, false),
        gt(otpCodesTable.expiresAt, now)
      )
    );

  if (!otp) {
    res.status(401).json({ success: false, message: "Kod hatalı veya süresi dolmuş." });
    return;
  }

  // Mark OTP as used
  await db
    .update(otpCodesTable)
    .set({ isUsed: true })
    .where(eq(otpCodesTable.id, otp.id));

  // Find user
  const allUsers = await db.select().from(usersTable);
  const user = allUsers.find((u) =>
    identifierType === "email"
      ? u.email?.toLowerCase() === identifier.toLowerCase()
      : u.phone?.replace(/\s/g, "") === identifier.replace(/\s/g, "")
  );

  if (!user) {
    res.status(404).json({ success: false, message: "Kullanıcı bulunamadı." });
    return;
  }

  // Create session
  const token = generateToken();
  const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(userSessionsTable).values({
    userId: user.id,
    token,
    expiresAt: sessionExpiresAt,
  });

  res.json(
    VerifyOtpResponse.parse({
      success: true,
      token,
      user: mapUser(user),
      message: "Giriş başarılı.",
    })
  );
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Yetkisiz." });
    return;
  }

  const now = new Date();
  const [session] = await db
    .select()
    .from(userSessionsTable)
    .where(
      and(
        eq(userSessionsTable.token, token),
        gt(userSessionsTable.expiresAt, now)
      )
    );

  if (!session) {
    res.status(401).json({ error: "Oturum süresi dolmuş." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));

  if (!user) {
    res.status(404).json({ error: "Kullanıcı bulunamadı." });
    return;
  }

  res.json(GetMeResponse.parse(mapUser(user)));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (token) {
    await db
      .delete(userSessionsTable)
      .where(eq(userSessionsTable.token, token));
  }

  res.json(LogoutResponse.parse({ success: true }));
});

export default router;
