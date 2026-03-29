import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/ui/alert";
import {
  CheckCircle2, XCircle, CreditCard, Calendar, AlertTriangle,
  Loader2, Crown, Zap, Shield, Star, Receipt, ArrowRight,
  ChevronRight, Ban, RefreshCw, Download, FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ────────────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  highlighted: boolean;
  badge: string | null;
}

interface Subscription {
  id: number;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  startedAt: string | null;
  expiresAt: string | null;
  nextPaymentAt: string | null;
  cancelledAt: string | null;
  cardMasked: string | null;
  cardHolder: string | null;
  autoRenew: boolean;
}

interface Transaction {
  id: number;
  referenceNo: string;
  paynetTransactionId: string | null;
  amount: number;
  currency: string;
  status: string;
  type: string;
  plan: string | null;
  description: string | null;
  cardMasked: string | null;
  bankName: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface Invoice {
  id: number;
  invoiceNo: string | null;
  amount: number | null;
  currency: string;
  description: string | null;
  originalName: string;
  mimeType: string;
  fileSize: number | null;
  uploadedAt: string;
  transactionId: number | null;
}

interface CardForm {
  owner: string;
  number: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
  saveCard: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL;

function api(path: string) {
  return `${BASE}api${path}`;
}

function fmt(n: number) {
  return n.toLocaleString("tr-TR") + " ₺";
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function planIcon(id: string) {
  if (id === "starter") return <Shield className="w-5 h-5" />;
  if (id === "corporate") return <Zap className="w-5 h-5" />;
  if (id === "premium") return <Crown className="w-5 h-5" />;
  return <Star className="w-5 h-5" />;
}

function planColor(id: string) {
  if (id === "starter") return "from-slate-50 to-slate-100 border-slate-200";
  if (id === "corporate") return "from-blue-50 to-blue-100 border-blue-200";
  if (id === "premium") return "from-amber-50 to-amber-100 border-amber-200";
  return "";
}

function statusLabel(s: string) {
  const map: Record<string, { label: string; color: string }> = {
    active:    { label: "Aktif",     color: "bg-green-100 text-green-700 border-green-200" },
    inactive:  { label: "Pasif",     color: "bg-slate-100 text-slate-600 border-slate-200" },
    cancelled: { label: "İptal",     color: "bg-red-100 text-red-700 border-red-200" },
    expired:   { label: "Süresi Dolmuş", color: "bg-orange-100 text-orange-700 border-orange-200" },
  };
  return map[s] ?? { label: s, color: "" };
}

function txStatusLabel(s: string) {
  const map: Record<string, { label: string; color: string }> = {
    success: { label: "Başarılı", color: "text-green-600" },
    pending: { label: "Bekliyor", color: "text-amber-600" },
    failed:  { label: "Başarısız", color: "text-red-600" },
  };
  return map[s] ?? { label: s, color: "" };
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const formRef = useRef<HTMLDivElement>(null);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [cardForm, setCardForm] = useState<CardForm>({
    owner: "", number: "", expireMonth: "", expireYear: "", cvc: "", saveCard: true,
  });

  const paymentResult = searchParams.get("payment");
  const txnId = searchParams.get("txn");

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadAll();
  }, []);

  // ── Handle 3D return ───────────────────────────────────────────────────────
  useEffect(() => {
    if (paymentResult === "success") {
      toast({ title: "Ödeme Başarılı!", description: "Aboneliğiniz aktif edildi. Hoş geldiniz!", className: "border-green-200 bg-green-50 text-green-800" });
      loadAll();
      navigate("/dashboard/abonelik", { replace: true });
    } else if (paymentResult === "failed") {
      toast({ title: "Ödeme Başarısız", description: "Ödeme tamamlanamadı. Lütfen tekrar deneyiniz.", variant: "destructive" });
      navigate("/dashboard/abonelik", { replace: true });
    }
  }, [paymentResult]);

  function downloadInvoice(id: number, name: string) {
    const link = document.createElement("a");
    link.href = api(`/payment/invoices/${id}/download`);
    link.download = name;
    link.click();
  }

  function fmtSize(b: number | null | undefined) {
    if (!b) return "";
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [plansRes, subRes, txnRes, invRes] = await Promise.all([
        fetch(api("/payment/plans"), { credentials: "include" }),
        fetch(api("/payment/subscription"), { credentials: "include" }),
        fetch(api("/payment/transactions"), { credentials: "include" }),
        fetch(api("/payment/invoices"), { credentials: "include" }),
      ]);
      const plansData = await plansRes.json();
      const subData = await subRes.json();
      const txnData = await txnRes.json();
      const invData = await invRes.json();

      setPlans(plansData.plans ?? []);
      setSubscription(subData.subscription ?? null);
      setTransactions(txnData.transactions ?? []);
      setInvoices(invData.invoices ?? []);
    } catch {
      toast({ title: "Hata", description: "Veriler yüklenemedi.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // ── Open payment modal ─────────────────────────────────────────────────────
  function openPayment(plan: Plan) {
    setSelectedPlan(plan);
    setCardForm({ owner: "", number: "", expireMonth: "", expireYear: "", cvc: "", saveCard: true });
    setPaymentOpen(true);
  }

  // ── Submit payment (3D Secure) ─────────────────────────────────────────────
  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) return;
    setPaying(true);

    try {
      const returnUrl = `${window.location.origin}${BASE}api/payment/callback-3d`;
      const res = await fetch(api("/payment/initiate-3d"), {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          cardOwner: cardForm.owner,
          cardNumber: cardForm.number.replace(/\s/g, ""),
          expireMonth: cardForm.expireMonth,
          expireYear: cardForm.expireYear,
          cvc: cardForm.cvc,
          saveCard: cardForm.saveCard,
          returnUrl,
        }),
      });
      const data = await res.json();

      if (data.notConfigured) {
        toast({
          title: "Ödeme Sistemi Yapılandırılmamış",
          description: "Paynet API anahtarları henüz ayarlanmamış. Yöneticiye bildirin.",
          variant: "destructive",
        });
        return;
      }

      if (!res.ok || !data.success) {
        toast({ title: "Hata", description: data.message ?? "İşlem başlatılamadı.", variant: "destructive" });
        return;
      }

      // Render the 3D form and submit to redirect user to bank
      if (data.htmlContent) {
        setPaymentOpen(false);
        // Inject and submit the bank redirect form
        const container = document.createElement("div");
        container.innerHTML = data.htmlContent;
        document.body.appendChild(container);
        const form = container.querySelector("form");
        if (form) {
          form.submit();
        } else {
          // Fallback: redirect to postUrl
          window.location.href = data.postUrl;
        }
      } else {
        toast({ title: "Hata", description: "3D form alınamadı.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Bağlantı Hatası", description: "Ödeme sunucusuna erişilemedi.", variant: "destructive" });
    } finally {
      setPaying(false);
    }
  }

  // ── Cancel subscription ────────────────────────────────────────────────────
  async function cancelSubscription() {
    setCancelling(true);
    try {
      const res = await fetch(api("/payment/cancel"), { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Abonelik İptal Edildi", description: data.message });
        setCancelOpen(false);
        loadAll();
      } else {
        toast({ title: "Hata", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Hata", description: "İstek gönderilemedi.", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  }

  // ── Current plan info ──────────────────────────────────────────────────────
  const currentPlanDef = plans.find(p => p.id === (subscription?.plan ?? "starter"));

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Abonelik & Ödemeler</h1>
        <p className="text-slate-500 mt-1">Plan yönetimi, ödeme geçmişi ve abonelik ayarları</p>
      </div>

      {/* Current subscription status */}
      <Card className="shadow-sm border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Mevcut Abonelik</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {subscription && subscription.status === "active" ? (
            <div className={`rounded-xl border p-5 bg-gradient-to-r ${planColor(subscription.plan)}`}>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {planIcon(subscription.plan)}
                    <h2 className="text-xl font-bold">{currentPlanDef?.name ?? subscription.plan} Plan</h2>
                    <Badge className={`text-xs font-medium border ${statusLabel(subscription.status).color}`}>
                      {statusLabel(subscription.status).label}
                    </Badge>
                    {!subscription.autoRenew && (
                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                        Yenileme Kapalı
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-slate-600">
                    {subscription.cardMasked && (
                      <p className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5" />
                        Kayıtlı kart: •••• {subscription.cardMasked.slice(-4)}
                        {subscription.cardHolder && ` — ${subscription.cardHolder}`}
                      </p>
                    )}
                    {subscription.nextPaymentAt && (
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Sonraki ödeme: <span className="font-medium">{fmtDate(subscription.nextPaymentAt)}</span>
                      </p>
                    )}
                    {subscription.startedAt && (
                      <p className="flex items-center gap-2 text-xs text-slate-400">
                        <RefreshCw className="w-3 h-3" />
                        Başlangıç: {fmtDate(subscription.startedAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{fmt(subscription.amount)}</p>
                  <p className="text-sm text-slate-500">/ay</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setCancelOpen(true)}
                  >
                    <Ban className="w-3.5 h-3.5 mr-1" />
                    İptal Et
                  </Button>
                </div>
              </div>
              {currentPlanDef && (
                <div className="mt-4 pt-4 border-t border-white/40">
                  <div className="flex flex-wrap gap-2">
                    {currentPlanDef.features.map(f => (
                      <span key={f} className="flex items-center gap-1 text-xs text-slate-600">
                        <CheckCircle2 className="w-3 h-3 text-green-500" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <CreditCard className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-700">Aktif abonelik yok</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                {subscription?.status === "cancelled"
                  ? `Aboneliğiniz ${fmtDate(subscription.cancelledAt)} tarihinde iptal edildi.`
                  : "Aşağıdaki planlardan birini seçerek premium özelliklerinize erişin."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Planlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => {
            const isCurrent = subscription?.status === "active" && subscription.plan === plan.id;
            return (
              <Card
                key={plan.id}
                className={`relative shadow-sm transition-shadow hover:shadow-md ${
                  plan.highlighted ? "border-blue-300 ring-1 ring-blue-200" : "border"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={`text-xs px-3 py-0.5 ${plan.highlighted ? "bg-blue-600" : "bg-amber-500"} text-white border-0`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={plan.highlighted ? "text-blue-600" : "text-slate-500"}>
                      {planIcon(plan.id)}
                    </span>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-end gap-1">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold">Ücretsiz</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">{plan.price.toLocaleString("tr-TR")}</span>
                        <span className="text-slate-500 mb-1">₺/ay</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button disabled className="w-full" variant="outline">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
                      Mevcut Plan
                    </Button>
                  ) : plan.price === 0 ? (
                    <Button disabled variant="ghost" className="w-full text-slate-400">
                      Ücretsiz Plan
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${plan.highlighted ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                      variant={plan.highlighted ? "default" : "outline"}
                      onClick={() => openPayment(plan)}
                    >
                      {subscription?.status === "active" ? "Yükselt" : "Abone Ol"}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">Fatura Geçmişi</CardTitle>
          </div>
          <CardDescription>Tüm ödeme işlemleri ve faturalar</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Henüz fatura kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Tarih</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Kart</TableHead>
                    <TableHead>Referans</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-center">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => {
                    const stat = txStatusLabel(tx.status);
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm text-slate-600">{fmtDate(tx.createdAt)}</TableCell>
                        <TableCell className="text-sm">
                          {tx.description ?? "Ödeme"}
                          {tx.bankName && <span className="text-xs text-slate-400 ml-1">· {tx.bankName}</span>}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {tx.cardMasked ? `•••• ${tx.cardMasked.slice(-4)}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 font-mono">{tx.referenceNo}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(tx.amount)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-xs font-semibold ${stat.color}`}>
                            {stat.label}
                          </span>
                          {tx.errorMessage && (
                            <p className="text-xs text-red-400 mt-0.5">{tx.errorMessage}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices from Admin */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Faturalarım</CardTitle>
          </div>
          <CardDescription>Yönetici tarafından yüklenen faturalarınızı görüntüleyip indirebilirsiniz</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-medium">Henüz fatura bulunmuyor</p>
              <p className="text-slate-400 text-xs mt-1">Faturalarınız hazırlandığında burada görünecektir</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Tarih</TableHead>
                    <TableHead>Fatura No</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Dosya</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-center">İndir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm text-slate-600">{fmtDate(inv.uploadedAt)}</TableCell>
                      <TableCell className="text-sm font-mono font-medium text-slate-700">{inv.invoiceNo ?? "—"}</TableCell>
                      <TableCell className="text-sm text-slate-600">{inv.description ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-sm text-slate-700 max-w-[150px] truncate">{inv.originalName}</span>
                          {inv.fileSize && <span className="text-xs text-slate-400">({fmtSize(inv.fileSize)})</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {inv.amount != null ? fmt(inv.amount) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => downloadInvoice(inv.id, inv.originalName)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> İndir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Ödeme Bilgileri
            </DialogTitle>
            <DialogDescription>
              {selectedPlan && (
                <>
                  <span className="font-medium">{selectedPlan.name} Plan</span> —{" "}
                  <span className="font-semibold text-slate-800">{fmt(selectedPlan.price)}/ay</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitPayment} className="space-y-4">
            {/* Card Owner */}
            <div>
              <Label htmlFor="cardOwner">Kart Üzerindeki İsim</Label>
              <Input
                id="cardOwner"
                placeholder="AD SOYAD"
                value={cardForm.owner}
                onChange={e => setCardForm(f => ({ ...f, owner: e.target.value.toUpperCase() }))}
                required
                className="mt-1 font-mono uppercase"
              />
            </div>

            {/* Card Number */}
            <div>
              <Label htmlFor="cardNumber">Kart Numarası</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardForm.number}
                onChange={e => setCardForm(f => ({ ...f, number: formatCardNumber(e.target.value) }))}
                required
                inputMode="numeric"
                maxLength={19}
                className="mt-1 font-mono"
              />
            </div>

            {/* Expire + CVC */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="expireMonth">Ay</Label>
                <Input
                  id="expireMonth"
                  placeholder="MM"
                  value={cardForm.expireMonth}
                  onChange={e => setCardForm(f => ({ ...f, expireMonth: e.target.value.slice(0, 2) }))}
                  required
                  inputMode="numeric"
                  maxLength={2}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="expireYear">Yıl</Label>
                <Input
                  id="expireYear"
                  placeholder="YY"
                  value={cardForm.expireYear}
                  onChange={e => setCardForm(f => ({ ...f, expireYear: e.target.value.slice(0, 2) }))}
                  required
                  inputMode="numeric"
                  maxLength={2}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  placeholder="•••"
                  value={cardForm.cvc}
                  onChange={e => setCardForm(f => ({ ...f, cvc: e.target.value.slice(0, 4) }))}
                  required
                  inputMode="numeric"
                  maxLength={4}
                  type="password"
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            {/* Security notice */}
            <Alert className="bg-blue-50 border-blue-200">
              <Shield className="w-4 h-4 text-blue-600" />
              <AlertTitle className="text-sm font-medium text-blue-800">Güvenli 3D Secure Ödeme</AlertTitle>
              <AlertDescription className="text-xs text-blue-600">
                Ödemeniz, bankanızın 3D Secure doğrulamasıyla güvence altına alınmıştır. Devam ettiğinizde
                bankanızın onay sayfasına yönlendirileceksiniz.
              </AlertDescription>
            </Alert>

            <Separator />

            {/* Summary */}
            {selectedPlan && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Ödenecek Tutar</span>
                <span className="text-xl font-bold">{fmt(selectedPlan.price)}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setPaymentOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={paying}>
                {paying ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> İşleniyor...</>
                ) : (
                  <><ArrowRight className="w-4 h-4 mr-2" /> Ödemeyi Başlat</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Aboneliği İptal Et
            </DialogTitle>
            <DialogDescription>
              Aboneliğinizi iptal etmek istediğinizden emin misiniz?
              Mevcut dönem sonuna kadar erişiminiz devam edecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setCancelOpen(false)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={cancelSubscription}
              disabled={cancelling}
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Evet, İptal Et"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden ref for 3D form injection */}
      <div ref={formRef} className="hidden" />
    </div>
  );
}
