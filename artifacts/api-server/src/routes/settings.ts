import { Router, type IRouter } from "express";
import { db, platformSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendSms, sendEmail } from "../lib/notifier";
import {
  GetSettingsResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
  TestSmsBody,
  TestSmsResponse,
  TestEmailBody,
  TestEmailResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DEFAULT_SETTINGS = [
  // SMS / Twilio
  { key: "twilio_account_sid",  label: "Twilio Account SID",   description: "Twilio hesabınızın Account SID değeri", group: "sms",   isSecret: true  },
  { key: "twilio_auth_token",   label: "Twilio Auth Token",     description: "Twilio API Auth Token",                group: "sms",   isSecret: true  },
  { key: "twilio_phone_number", label: "Twilio Telefon No",     description: "Mesaj gönderilecek Twilio numarası (örn: +19876543210)", group: "sms", isSecret: false },

  // Email / SMTP
  { key: "smtp_host",  label: "SMTP Sunucu",      description: "Örn: smtp.gmail.com",             group: "email", isSecret: false },
  { key: "smtp_port",  label: "SMTP Port",         description: "Örn: 587 (TLS) veya 465 (SSL)",  group: "email", isSecret: false },
  { key: "smtp_user",  label: "SMTP Kullanıcı",    description: "E-posta adresi",                  group: "email", isSecret: false },
  { key: "smtp_pass",  label: "SMTP Şifre",        description: "E-posta veya uygulama şifresi",   group: "email", isSecret: true  },
  { key: "smtp_from",  label: "Gönderen Adres",    description: 'Örn: "TaşıYo <no-reply@tasiyo.com>"', group: "email", isSecret: false },

  // Paynet
  { key: "paynet_secret_key",    label: "Paynet Secret Key",    description: "Paynet API Secret Key (Hesabım → Firma Bilgileri → Entegrasyon Bilgileri)", group: "paynet", isSecret: true  },
  { key: "paynet_merchant_id",   label: "Paynet Bayi Kodu",     description: "Paynet Bayi Kodu (Hesabım → Firma Bilgileri)",                              group: "paynet", isSecret: true  },
  { key: "paynet_ratio_code",    label: "Paynet Oran Kodu",     description: "Taksit/komisyon oran kodu (Hesabım → Oran alanından oluşturun)",            group: "paynet", isSecret: false },
  { key: "paynet_base_url",      label: "Paynet API URL",       description: "Paynet API temel URL (varsayılan: https://api.paynet.com.tr)",              group: "paynet", isSecret: false },

  // Platform
  { key: "platform_name",       label: "Platform Adı",              description: "Platformun görünen adı (varsayılan: TaşıYo)",                       group: "platform", isSecret: false },
  { key: "platform_logo",       label: "Platform Logosu (Koyu)",    description: "Açık arka planlarda kullanılan logo (base64 resim)",                group: "platform", isSecret: false },
  { key: "platform_logo_light", label: "Platform Logosu (Açık)",    description: "Koyu/renkli arka planlarda kullanılan açık renkli logo (base64 resim)", group: "platform", isSecret: false },
  { key: "platform_support_email", label: "Destek E-posta",  description: "Kullanıcıların ulaşacağı destek adresi", group: "platform", isSecret: false },
  { key: "otp_expiry_minutes",     label: "OTP Süresi (dk)", description: "Doğrulama kodunun geçerlilik süresi",   group: "platform", isSecret: false },
  { key: "max_otp_attempts",       label: "Maks. OTP Deneme", description: "Başarısız giriş denemesi limiti",     group: "platform", isSecret: false },
];

async function ensureDefaultSettings() {
  const existing = await db.select().from(platformSettingsTable);
  const existingKeys = new Set(existing.map((s) => s.key));

  for (const def of DEFAULT_SETTINGS) {
    if (!existingKeys.has(def.key)) {
      await db.insert(platformSettingsTable).values({
        key: def.key,
        value: null,
        label: def.label,
        description: def.description,
        group: def.group,
        isSecret: def.isSecret,
      });
    }
  }
}

function mapSetting(s: typeof platformSettingsTable.$inferSelect) {
  return {
    id: s.id,
    key: s.key,
    value: s.isSecret && s.value ? "••••••••" : (s.value ?? undefined),
    label: s.label,
    description: s.description ?? undefined,
    group: s.group,
    isSecret: s.isSecret,
    updatedAt: s.updatedAt,
  };
}

// Public endpoint — no auth required, returns only non-secret platform branding
router.get("/settings/public", async (req, res): Promise<void> => {
  await ensureDefaultSettings();
  const rows = await db
    .select()
    .from(platformSettingsTable)
    .orderBy(platformSettingsTable.key);

  const publicKeys = ["platform_name", "platform_logo", "platform_logo_light"];
  const result: Record<string, string | null> = {};
  for (const row of rows) {
    if (publicKeys.includes(row.key)) {
      result[row.key] = row.value ?? null;
    }
  }
  res.json(result);
});

router.get("/settings", async (req, res): Promise<void> => {
  await ensureDefaultSettings();
  const settings = await db
    .select()
    .from(platformSettingsTable)
    .orderBy(platformSettingsTable.group, platformSettingsTable.key);

  res.json(GetSettingsResponse.parse({ settings: settings.map(mapSetting) }));
});

router.put("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await ensureDefaultSettings();

  for (const { key, value } of parsed.data.settings) {
    // Skip if value is the masked placeholder
    if (value === "••••••••") continue;
    // Find existing
    const [existing] = await db
      .select()
      .from(platformSettingsTable)
      .where(eq(platformSettingsTable.key, key));

    if (existing) {
      await db
        .update(platformSettingsTable)
        .set({ value: value ?? null, updatedAt: new Date() })
        .where(eq(platformSettingsTable.key, key));
    } else {
      const def = DEFAULT_SETTINGS.find((d) => d.key === key);
      if (def) {
        await db.insert(platformSettingsTable).values({
          key,
          value: value ?? null,
          label: def.label,
          description: def.description,
          group: def.group,
          isSecret: def.isSecret,
        });
      }
    }
  }

  const settings = await db
    .select()
    .from(platformSettingsTable)
    .orderBy(platformSettingsTable.group, platformSettingsTable.key);

  res.json(UpdateSettingsResponse.parse({ settings: settings.map(mapSetting) }));
});

router.post("/settings/test-sms", async (req, res): Promise<void> => {
  const parsed = TestSmsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Geçersiz telefon numarası." });
    return;
  }

  const result = await sendSms(
    parsed.data.phone,
    "TaşıYo — Bu bir test mesajıdır. SMS entegrasyonunuz başarıyla çalışıyor! 🚚"
  );

  let message: string;
  if (result.success) {
    message = "Test SMS başarıyla gönderildi.";
  } else if (result.notConfigured) {
    message = "Twilio yapılandırılmamış. Lütfen Account SID, Auth Token ve telefon numarasını kaydedin.";
  } else {
    message = `SMS gönderilemedi. Twilio hatası: ${result.errorMessage}`;
  }

  res.json(TestSmsResponse.parse({ success: result.success, message }));
});

router.post("/settings/test-email", async (req, res): Promise<void> => {
  const parsed = TestEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Geçersiz e-posta adresi." });
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="color: #1e40af;">🚚 TaşıYo — Test E-postası</h2>
      <p>Bu e-posta, SMTP yapılandırmanızın doğruluğunu test etmek için gönderilmiştir.</p>
      <p style="color: #16a34a; font-weight: bold;">✅ E-posta entegrasyonunuz başarıyla çalışıyor!</p>
    </div>`;

  const result = await sendEmail(parsed.data.email, "TaşıYo — SMTP Test E-postası", html);

  let message: string;
  if (result.success) {
    message = "Test e-postası başarıyla gönderildi.";
  } else if (result.notConfigured) {
    message = "SMTP yapılandırılmamış. Lütfen sunucu, kullanıcı ve şifreyi kaydedin.";
  } else {
    message = `E-posta gönderilemedi. SMTP hatası: ${result.errorMessage}`;
  }

  res.json(TestEmailResponse.parse({ success: result.success, message }));
});

export default router;
