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

export async function sendSms(to: string, body: string): Promise<boolean> {
  const accountSid = await getSetting("twilio_account_sid") || process.env.TWILIO_ACCOUNT_SID;
  const authToken  = await getSetting("twilio_auth_token")  || process.env.TWILIO_AUTH_TOKEN;
  const fromPhone  = await getSetting("twilio_phone_number") || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    logger.warn({ to, body }, "Twilio not configured — OTP code logged to console");
    logger.info({ otp_code: body, sent_to: to }, "📱 [DEV SMS]");
    return false;
  }

  try {
    const { default: twilio } = await import("twilio");
    const client = twilio(accountSid, authToken);
    await client.messages.create({ body, from: fromPhone, to });
    logger.info({ to }, "SMS sent via Twilio");
    return true;
  } catch (err) {
    logger.error({ err, to }, "Twilio SMS send failed");
    return false;
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const host   = await getSetting("smtp_host") || process.env.SMTP_HOST;
  const port   = await getSetting("smtp_port") || process.env.SMTP_PORT;
  const user   = await getSetting("smtp_user") || process.env.SMTP_USER;
  const pass   = await getSetting("smtp_pass") || process.env.SMTP_PASS;
  const from   = await getSetting("smtp_from") || process.env.SMTP_FROM || "TaşıYo <no-reply@tasiyo.com>";

  if (!host || !user || !pass) {
    logger.warn({ to, subject }, "SMTP not configured — OTP logged to console");
    logger.info({ otp_subject: subject, sent_to: to, html_body: html }, "📧 [DEV EMAIL]");
    return false;
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
    logger.info({ to, subject }, "Email sent via SMTP");
    return true;
  } catch (err) {
    logger.error({ err, to }, "SMTP email send failed");
    return false;
  }
}
