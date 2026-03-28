import { db, platformSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(platformSettingsTable)
    .where(eq(platformSettingsTable.key, key));
  return row?.value ?? null;
}

export type SendResult =
  | { success: true }
  | { success: false; notConfigured: true }
  | { success: false; notConfigured: false; errorMessage: string };

export async function sendSms(to: string, body: string): Promise<SendResult> {
  const accountSid = await getSetting("twilio_account_sid") || process.env.TWILIO_ACCOUNT_SID;
  const authToken  = await getSetting("twilio_auth_token")  || process.env.TWILIO_AUTH_TOKEN;
  const fromPhone  = await getSetting("twilio_phone_number") || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    logger.warn({ to }, "Twilio yapılandırılmamış — OTP admin paneline yazılıyor");
    return { success: false, notConfigured: true };
  }

  try {
    const { default: twilio } = await import("twilio");
    const client = twilio(accountSid, authToken);
    await client.messages.create({ body, from: fromPhone, to });
    logger.info({ to }, "SMS Twilio üzerinden gönderildi");
    return { success: true };
  } catch (err: any) {
    const msg: string = err?.message ?? String(err);
    logger.error({ err, to }, "Twilio SMS gönderilemedi");
    return { success: false, notConfigured: false, errorMessage: msg };
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendResult> {
  const host = await getSetting("smtp_host") || process.env.SMTP_HOST;
  const port = await getSetting("smtp_port") || process.env.SMTP_PORT;
  const user = await getSetting("smtp_user") || process.env.SMTP_USER;
  const pass = await getSetting("smtp_pass") || process.env.SMTP_PASS;
  const from = await getSetting("smtp_from") || process.env.SMTP_FROM || "TaşıYo <no-reply@tasiyo.com>";

  if (!host || !user || !pass) {
    logger.warn({ to, subject }, "SMTP yapılandırılmamış — OTP admin paneline yazılıyor");
    return { success: false, notConfigured: true };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port ?? "587", 10),
      secure: parseInt(port ?? "587", 10) === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({ from, to, subject, html });
    logger.info({ to, subject }, "E-posta SMTP üzerinden gönderildi");
    return { success: true };
  } catch (err: any) {
    const msg: string = err?.message ?? String(err);
    logger.error({ err, to }, "SMTP e-posta gönderilemedi");
    return { success: false, notConfigured: false, errorMessage: msg };
  }
}

/** Yardımcı: sonuca göre boolean döner (geriye dönük uyumluluk için) */
export function wasSent(result: SendResult): boolean {
  return result.success;
}
