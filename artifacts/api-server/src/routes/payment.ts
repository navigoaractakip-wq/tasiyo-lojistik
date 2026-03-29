import { Router, type IRouter } from "express";
import { db, subscriptionsTable, paymentTransactionsTable, platformSettingsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth-middleware";
import { randomUUID } from "crypto";
import { getPlansFromDb } from "./admin-billing";

const router: IRouter = Router();

// ── Helper: get Paynet config from DB ────────────────────────────────────────
async function getPaynetConfig() {
  const rows = await db
    .select()
    .from(platformSettingsTable)
    .where(
      eq(platformSettingsTable.group, "paynet")
    );

  const map: Record<string, string> = {};
  for (const r of rows) {
    if (r.value) map[r.key] = r.value;
  }

  return {
    secretKey: map["paynet_secret_key"] ?? process.env.PAYNET_SECRET_KEY ?? "",
    merchantId: map["paynet_merchant_id"] ?? process.env.PAYNET_MERCHANT_ID ?? "",
    ratioCode: map["paynet_ratio_code"] ?? process.env.PAYNET_RATIO_CODE ?? "",
    baseUrl: map["paynet_base_url"] ?? "https://api.paynet.com.tr",
  };
}

// ── Helper: make Paynet API request ─────────────────────────────────────────
async function paynetPost(path: string, body: Record<string, unknown>, secretKey: string, baseUrl: string) {
  const credentials = Buffer.from(`${secretKey}:`).toString("base64");
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${credentials}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Paynet API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

// ── GET /payment/plans?role=corporate|driver ──────────────────────────────────
router.get("/payment/plans", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const roleParam = req.query.role as string | undefined;
  const userRole = req.userRole;
  const role = roleParam ?? (userRole === "driver" ? "driver" : "corporate");
  const plans = await getPlansFromDb(role);
  res.json({ plans });
});

// ── GET /payment/subscription ────────────────────────────────────────────────
router.get("/payment/subscription", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);

  res.json({ subscription: sub ?? null });
});

// ── GET /payment/transactions ────────────────────────────────────────────────
router.get("/payment/transactions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;

  const txns = await db
    .select()
    .from(paymentTransactionsTable)
    .where(eq(paymentTransactionsTable.userId, userId))
    .orderBy(desc(paymentTransactionsTable.createdAt))
    .limit(50);

  res.json({ transactions: txns });
});

// ── POST /payment/initiate-3d ─────────────────────────────────────────────────
// Initiates a 3D Secure payment via Paynet tds_initial
router.post("/payment/initiate-3d", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const { planId, cardOwner, cardNumber, expireMonth, expireYear, cvc, saveCard, returnUrl } = req.body;

  const plans = await getPlansFromDb();
  const plan = plans.find(p => p.id === planId);
  if (!plan) {
    res.status(400).json({ success: false, message: "Geçersiz plan seçimi." });
    return;
  }
  if (plan.price === 0) {
    res.status(400).json({ success: false, message: "Ücretsiz plan için ödeme gerekmez." });
    return;
  }

  const config = await getPaynetConfig();
  if (!config.secretKey) {
    res.status(503).json({ success: false, message: "Ödeme sistemi henüz yapılandırılmamış. Lütfen yöneticiye başvurun.", notConfigured: true });
    return;
  }

  const referenceNo = `TASIYO-${userId}-${Date.now()}`;
  const amountStr = plan.price.toString().replace(".", ",");

  // Get user info for customer data
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  // Determine callback URL
  const baseCallbackUrl = returnUrl ?? `${process.env.REPLIT_DEV_DOMAIN ?? "http://localhost:8080"}/api/payment/callback-3d`;

  // Create transaction record (pending)
  const [txn] = await db.insert(paymentTransactionsTable).values({
    userId,
    referenceNo,
    amount: plan.price,
    currency: "TRY",
    status: "pending",
    type: "charge",
    plan: plan.id,
    description: `${plan.name} Plan - Aylık Abonelik`,
  }).returning();

  try {
    const paynetBody: Record<string, unknown> = {
      amount: amountStr,
      reference_no: referenceNo,
      return_url: baseCallbackUrl,
      customer: {
        first_name: (user?.name ?? "").split(" ")[0] ?? "Müşteri",
        last_name: (user?.name ?? "").split(" ").slice(1).join(" ") || "Kullanıcı",
        email: user?.email ?? "",
        phone: (user?.phone ?? "").replace(/\D/g, ""),
      },
      card_owner: cardOwner,
      card_number: cardNumber?.replace(/\s/g, ""),
      expire_month: expireMonth,
      expire_year: expireYear,
      cvc,
    };

    if (config.ratioCode) paynetBody.ratio_code = config.ratioCode;
    if (saveCard) {
      paynetBody.save_card = true;
      paynetBody.card_desc = `${plan.name} Plan Kartı`;
      paynetBody.user_unique_id = String(userId);
    }

    const result = await paynetPost("/v2/transaction/tds_initial", paynetBody, config.secretKey, config.baseUrl);

    // Store session/token IDs on transaction
    await db.update(paymentTransactionsTable)
      .set({
        paynetSessionId: String(result.session_id ?? ""),
        paynetTokenId: String(result.token_id ?? ""),
      })
      .where(eq(paymentTransactionsTable.id, txn.id));

    res.json({
      success: true,
      transactionId: txn.id,
      referenceNo,
      sessionId: result.session_id,
      tokenId: result.token_id,
      postUrl: result.post_url,
      htmlContent: result.html_content,
      code: result.code,
      message: result.message,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Bilinmeyen hata";
    await db.update(paymentTransactionsTable)
      .set({ status: "failed", errorMessage: errMsg })
      .where(eq(paymentTransactionsTable.id, txn.id));

    res.status(502).json({ success: false, message: `Ödeme başlatılamadı: ${errMsg}` });
  }
});

// ── POST /payment/callback-3d ─────────────────────────────────────────────────
// Called by Paynet/bank after 3D OTP verification
router.post("/payment/callback-3d", async (req, res): Promise<void> => {
  const { session_id, token_id } = req.body;

  if (!session_id || !token_id) {
    res.status(400).send("Geçersiz callback parametreleri");
    return;
  }

  const config = await getPaynetConfig();
  if (!config.secretKey) {
    res.status(503).send("Ödeme sistemi yapılandırılmamış");
    return;
  }

  // Find the transaction by session_id
  const [txn] = await db
    .select()
    .from(paymentTransactionsTable)
    .where(eq(paymentTransactionsTable.paynetSessionId, String(session_id)))
    .limit(1);

  if (!txn) {
    res.status(404).send("İşlem bulunamadı");
    return;
  }

  try {
    const result = await paynetPost(
      "/v2/transaction/tds_charge",
      { session_id, token_id },
      config.secretKey,
      config.baseUrl
    );

    const isSuccess = result.is_succeed === true;

    await db.update(paymentTransactionsTable)
      .set({
        status: isSuccess ? "success" : "failed",
        paynetTransactionId: result.id ? String(result.id) : undefined,
        cardMasked: result.card_no_masked ? String(result.card_no_masked) : undefined,
        cardHolder: result.card_holder ? String(result.card_holder) : undefined,
        bankName: result.bank_name ? String(result.bank_name) : undefined,
        authorizationCode: result.bank_authorization_code ? String(result.bank_authorization_code) : undefined,
        errorMessage: isSuccess ? undefined : "3D doğrulama başarısız",
      })
      .where(eq(paymentTransactionsTable.id, txn.id));

    if (isSuccess) {
      // Activate subscription
      const now = new Date();
      const nextPayment = new Date(now);
      nextPayment.setMonth(nextPayment.getMonth() + 1);

      const allPlans = await getPlansFromDb();
      const plan = allPlans.find(p => p.id === txn.plan);

      // Upsert subscription
      const [existingSub] = await db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.userId, txn.userId))
        .limit(1);

      if (existingSub) {
        await db.update(subscriptionsTable)
          .set({
            plan: txn.plan ?? "corporate",
            status: "active",
            amount: txn.amount,
            startedAt: now,
            expiresAt: nextPayment,
            nextPaymentAt: nextPayment,
            cancelledAt: null,
            cardMasked: result.card_no_masked ? String(result.card_no_masked) : existingSub.cardMasked,
            cardHolder: result.card_holder ? String(result.card_holder) : existingSub.cardHolder,
            updatedAt: now,
          })
          .where(eq(subscriptionsTable.id, existingSub.id));
      } else {
        await db.insert(subscriptionsTable).values({
          userId: txn.userId,
          plan: txn.plan ?? "corporate",
          status: "active",
          amount: txn.amount,
          startedAt: now,
          expiresAt: nextPayment,
          nextPaymentAt: nextPayment,
          cardMasked: result.card_no_masked ? String(result.card_no_masked) : undefined,
          cardHolder: result.card_holder ? String(result.card_holder) : undefined,
        });
      }

      // Update transaction with subscription
      await db.update(paymentTransactionsTable)
        .set({ plan: txn.plan ?? plan?.id })
        .where(eq(paymentTransactionsTable.id, txn.id));
    }

    // Redirect back to the platform with result
    const frontendBase = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:3000";
    const status = isSuccess ? "success" : "failed";
    const txnId = txn.id;
    res.redirect(`${frontendBase}/lojistik-platform/dashboard/abonelik?payment=${status}&txn=${txnId}`);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Bilinmeyen hata";
    await db.update(paymentTransactionsTable)
      .set({ status: "failed", errorMessage: errMsg })
      .where(eq(paymentTransactionsTable.id, txn.id));

    res.redirect(`/dashboard/abonelik?payment=failed`);
  }
});

// ── POST /payment/direct ──────────────────────────────────────────────────────
// Direct (non-3D) payment for testing / admin use
router.post("/payment/direct", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const { planId, cardOwner, cardNumber, expireMonth, expireYear, cvc, saveCard } = req.body;

  const allPlansD = await getPlansFromDb();
  const plan = allPlansD.find(p => p.id === planId);
  if (!plan || plan.price === 0) {
    res.status(400).json({ success: false, message: "Geçersiz plan." });
    return;
  }

  const config = await getPaynetConfig();
  if (!config.secretKey) {
    res.status(503).json({ success: false, message: "Ödeme sistemi yapılandırılmamış.", notConfigured: true });
    return;
  }

  const referenceNo = `TASIYO-D-${userId}-${Date.now()}`;
  const amountStr = plan.price.toString();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  const [txn] = await db.insert(paymentTransactionsTable).values({
    userId,
    referenceNo,
    amount: plan.price,
    currency: "TRY",
    status: "pending",
    type: "charge",
    plan: plan.id,
    description: `${plan.name} Plan - Direkt Ödeme`,
  }).returning();

  try {
    const paynetBody: Record<string, unknown> = {
      amount: amountStr,
      reference_no: referenceNo,
      card_owner: cardOwner,
      card_number: cardNumber?.replace(/\s/g, ""),
      expire_month: expireMonth,
      expire_year: expireYear,
      cvc,
    };
    if (config.ratioCode) paynetBody.ratio_code = config.ratioCode;
    if (saveCard) {
      paynetBody.save_card = true;
      paynetBody.card_desc = `${plan.name} Kartı`;
      paynetBody.user_unique_id = String(userId);
    }

    const result = await paynetPost("/v2/transaction/payment", paynetBody, config.secretKey, config.baseUrl);
    const isSuccess = result.is_succeed === true;

    const now = new Date();
    const nextPayment = new Date(now);
    nextPayment.setMonth(nextPayment.getMonth() + 1);

    await db.update(paymentTransactionsTable).set({
      status: isSuccess ? "success" : "failed",
      paynetTransactionId: result.id ? String(result.id) : undefined,
      cardMasked: result.card_no_masked ? String(result.card_no_masked) : undefined,
      cardHolder: result.card_holder ? String(result.card_holder) : undefined,
      bankName: result.bank_name ? String(result.bank_name) : undefined,
      authorizationCode: result.bank_authorization_code ? String(result.bank_authorization_code) : undefined,
    }).where(eq(paymentTransactionsTable.id, txn.id));

    if (isSuccess) {
      const [existingSub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId)).limit(1);
      if (existingSub) {
        await db.update(subscriptionsTable).set({
          plan: plan.id, status: "active", amount: plan.price,
          startedAt: now, expiresAt: nextPayment, nextPaymentAt: nextPayment,
          cardMasked: result.card_no_masked ? String(result.card_no_masked) : undefined,
          updatedAt: now,
        }).where(eq(subscriptionsTable.id, existingSub.id));
      } else {
        await db.insert(subscriptionsTable).values({
          userId, plan: plan.id, status: "active", amount: plan.price,
          startedAt: now, expiresAt: nextPayment, nextPaymentAt: nextPayment,
          cardMasked: result.card_no_masked ? String(result.card_no_masked) : undefined,
        });
      }
    }

    res.json({ success: isSuccess, referenceNo, transactionId: txn.id, paynetResult: result });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Hata";
    await db.update(paymentTransactionsTable).set({ status: "failed", errorMessage: errMsg }).where(eq(paymentTransactionsTable.id, txn.id));
    res.status(502).json({ success: false, message: `Ödeme başarısız: ${errMsg}` });
  }
});

// ── POST /payment/cancel ──────────────────────────────────────────────────────
router.post("/payment/cancel", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
    .limit(1);

  if (!sub) {
    res.status(404).json({ success: false, message: "Aktif abonelik bulunamadı." });
    return;
  }

  await db.update(subscriptionsTable)
    .set({ status: "cancelled", cancelledAt: new Date(), autoRenew: false, updatedAt: new Date() })
    .where(eq(subscriptionsTable.id, sub.id));

  res.json({ success: true, message: "Aboneliğiniz dönem sonunda iptal edilecektir." });
});

export default router;
