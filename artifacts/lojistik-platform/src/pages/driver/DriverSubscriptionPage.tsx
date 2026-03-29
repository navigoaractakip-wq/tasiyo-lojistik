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
  Loader2, Crown, Zap, Shield, Star, Receipt, Download, FileText,
  Ban, Truck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

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

const BASE = import.meta.env.BASE_URL;

function api(path: string) { return `${BASE}api${path}`; }
function fmt(n: number) { return n.toLocaleString("tr-TR") + " ₺"; }
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function planIcon(id: string) {
  if (id === "driver_starter") return <Shield className="w-5 h-5" />;
  if (id === "driver_professional") return <Zap className="w-5 h-5" />;
  if (id === "driver_premium") return <Crown className="w-5 h-5" />;
  return <Star className="w-5 h-5" />;
}

function planColor(id: string) {
  if (id === "driver_starter") return "from-slate-50 to-slate-100 border-slate-200";
  if (id === "driver_professional") return "from-orange-50 to-orange-100 border-orange-200";
  if (id === "driver_premium") return "from-amber-50 to-amber-100 border-amber-200";
  return "from-slate-50 to-slate-100 border-slate-200";
}

function planIconColor(id: string) {
  if (id === "driver_starter") return "text-slate-500";
  if (id === "driver_professional") return "text-orange-500";
  if (id === "driver_premium") return "text-amber-500";
  return "text-slate-500";
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

export default function DriverSubscriptionPage() {
  const { toast } = useToast();
  const { token } = useAuth();

  function authHeaders(extra?: Record<string, string>) {
    return { Authorization: `Bearer ${token ?? ""}`, ...extra };
  }

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
    owner: "", number: "", expireMonth: "", expireYear: "", cvc: "", saveCard: false,
  });

  const paymentResult = searchParams.get("payment");

  useEffect(() => {
    if (paymentResult === "success") {
      toast({ title: "Ödeme Başarılı!", description: "Aboneliğiniz aktif edildi." });
      navigate("/driver/abonelik", { replace: true });
    } else if (paymentResult === "fail") {
      toast({ title: "Ödeme Başarısız", description: "İşlem tamamlanamadı, lütfen tekrar deneyin.", variant: "destructive" });
      navigate("/driver/abonelik", { replace: true });
    }
  }, [paymentResult]);

  async function downloadInvoice(id: number, name: string) {
    try {
      const res = await fetch(api(`/payment/invoices/${id}/download`), { headers: authHeaders() });
      if (!res.ok) { toast({ title: "İndirme başarısız", variant: "destructive" }); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "İndirme hatası", variant: "destructive" });
    }
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
        fetch(api("/payment/plans?role=driver"), { headers: authHeaders() }),
        fetch(api("/payment/subscription"), { headers: authHeaders() }),
        fetch(api("/payment/transactions"), { headers: authHeaders() }),
        fetch(api("/payment/invoices"), { headers: authHeaders() }),
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

  useEffect(() => { loadAll(); }, [token]);

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) return;
    setPaying(true);

    try {
      const returnUrl = `${window.location.origin}${BASE}api/payment/callback-3d`;
      const res = await fetch(api("/payment/initiate-3d"), {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
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
        toast({ title: "Ödeme Sistemi Hazır Değil", description: "Lütfen yöneticiyle iletişime geçin.", variant: "destructive" });
        return;
      }

      if (data.htmlContent) {
        const div = formRef.current!;
        div.innerHTML = data.htmlContent;
        const form = div.querySelector("form");
        if (form) { form.submit(); return; }
      }

      if (data.success) {
        toast({ title: "Abonelik Aktif!", description: `${selectedPlan.name} planı aktif edildi.` });
        setPaymentOpen(false);
        loadAll();
      } else {
        toast({ title: "Ödeme Hatası", description: data.message ?? "İşlem başarısız.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setPaying(false);
    }
  }

  async function cancelSubscription() {
    setCancelling(true);
    try {
      const res = await fetch(api("/payment/cancel"), { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Abonelik İptal Edildi", description: data.message });
        setCancelOpen(false);
        loadAll();
      } else {
        toast({ title: "Hata", description: data.error ?? "İptal edilemedi.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  }

  const activePlan = plans.find(p => p.id === subscription?.plan);
  const isActive = subscription?.status === "active";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      {/* Hidden 3D Secure form container */}
      <div ref={formRef} className="hidden" />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Truck className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-slate-900">Sürücü Aboneliği</h1>
        </div>
        <p className="text-slate-500">Plan seçerek kurumsal ve premium ilanları görüntüleyebilirsiniz</p>
      </div>

      {/* Info Banner: what each plan unlocks */}
      <Alert className="border-orange-200 bg-orange-50">
        <Star className="w-4 h-4 text-orange-500" />
        <AlertTitle className="text-orange-800 font-semibold">Neden Abone Olmalıyım?</AlertTitle>
        <AlertDescription className="text-orange-700 text-sm mt-1">
          <span className="font-medium">Ücretsiz</span> planda yalnızca temel ilanları görürsünüz.{" "}
          <span className="font-medium">Profesyonel veya Premium</span> plan ile tüm kurumsal ve premium yüklere erişebilir, öncelikli teklif sıralamasından yararlanabilirsiniz.
        </AlertDescription>
      </Alert>

      {/* Active Subscription Status */}
      {isActive && subscription && (
        <Card className="shadow-sm border-green-200 bg-green-50/50">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">
                    {activePlan?.name ?? subscription.plan} Planı Aktif
                  </p>
                  <p className="text-sm text-green-700">
                    {subscription.expiresAt
                      ? `Bitiş: ${fmtDate(subscription.expiresAt)}`
                      : subscription.nextPaymentAt
                      ? `Sonraki ödeme: ${fmtDate(subscription.nextPaymentAt)}`
                      : "Süresiz"}
                  </p>
                  {subscription.cardMasked && (
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                      <CreditCard className="w-3 h-3" /> {subscription.cardMasked}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setCancelOpen(true)}
              >
                <Ban className="w-3.5 h-3.5 mr-1.5" /> İptal Et
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const isCurrent = isActive && subscription?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-5 bg-gradient-to-br transition-all ${planColor(plan.id)} ${
                plan.highlighted ? "shadow-lg ring-2 ring-orange-400/30" : "shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-orange-500 text-white border-0 shadow-sm text-xs px-3">{plan.badge}</Badge>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3 mt-1">
                <span className={planIconColor(plan.id)}>{planIcon(plan.id)}</span>
                <h3 className="font-bold text-slate-800">{plan.name}</h3>
                {isCurrent && <Badge className="bg-green-500 text-white border-0 text-xs ml-auto">Aktif</Badge>}
              </div>

              <div className="mb-4">
                <span className="text-3xl font-extrabold text-slate-900">
                  {plan.price === 0 ? "Ücretsiz" : fmt(plan.price)}
                </span>
                {plan.price > 0 && <span className="text-slate-500 text-sm ml-1">/ay</span>}
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="text-sm text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.price === 0 ? (
                <Button disabled className="w-full" variant="outline">
                  {isCurrent ? "Mevcut Plan" : "Ücretsiz"}
                </Button>
              ) : isCurrent ? (
                <Button disabled className="w-full bg-green-500 text-white border-0 cursor-default">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Aktif Plan
                </Button>
              ) : (
                <Button
                  className={`w-full ${plan.highlighted ? "bg-orange-500 hover:bg-orange-600" : "bg-slate-800 hover:bg-slate-900"} text-white`}
                  onClick={() => { setSelectedPlan(plan); setPaymentOpen(true); }}
                >
                  <CreditCard className="w-4 h-4 mr-1.5" /> Abone Ol
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment History */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">Ödeme Geçmişi</CardTitle>
          </div>
          <CardDescription>Abonelik ödemelerinizin geçmişi</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-medium">Henüz ödeme işlemi yok</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Tarih</TableHead>
                    <TableHead>Referans</TableHead>
                    <TableHead>Plan</TableHead>
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
                        <TableCell className="text-xs font-mono text-slate-500">{tx.referenceNo}</TableCell>
                        <TableCell className="text-sm">{tx.plan ?? "—"}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(tx.amount)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-xs font-semibold ${stat.color}`}>{stat.label}</span>
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

      {/* Invoices */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Faturalarım</CardTitle>
          </div>
          <CardDescription>Yönetici tarafından yüklenen faturalarınızı indirebilirsiniz</CardDescription>
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
                    <TableHead>Dosya</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-center">İndir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm text-slate-600">{fmtDate(inv.uploadedAt)}</TableCell>
                      <TableCell className="text-sm font-mono font-medium">{inv.invoiceNo ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-sm text-slate-700 max-w-[140px] truncate">{inv.originalName}</span>
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
              <CreditCard className="w-5 h-5 text-orange-500" />
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
            <div>
              <Label htmlFor="dCardOwner">Kart Üzerindeki İsim</Label>
              <Input
                id="dCardOwner"
                value={cardForm.owner}
                onChange={e => setCardForm(f => ({ ...f, owner: e.target.value }))}
                placeholder="AD SOYAD"
                className="mt-1 uppercase"
                required
              />
            </div>
            <div>
              <Label htmlFor="dCardNumber">Kart Numarası</Label>
              <Input
                id="dCardNumber"
                value={cardForm.number}
                onChange={e => setCardForm(f => ({ ...f, number: formatCardNumber(e.target.value) }))}
                placeholder="1234 5678 9012 3456"
                className="mt-1 font-mono tracking-widest"
                maxLength={19}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="dExpMonth">Ay</Label>
                <Input
                  id="dExpMonth"
                  value={cardForm.expireMonth}
                  onChange={e => setCardForm(f => ({ ...f, expireMonth: e.target.value.slice(0, 2) }))}
                  placeholder="MM"
                  className="mt-1 text-center"
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dExpYear">Yıl</Label>
                <Input
                  id="dExpYear"
                  value={cardForm.expireYear}
                  onChange={e => setCardForm(f => ({ ...f, expireYear: e.target.value.slice(0, 4) }))}
                  placeholder="YYYY"
                  className="mt-1 text-center"
                  maxLength={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dCvc">CVV</Label>
                <Input
                  id="dCvc"
                  type="password"
                  value={cardForm.cvc}
                  onChange={e => setCardForm(f => ({ ...f, cvc: e.target.value.slice(0, 4) }))}
                  placeholder="•••"
                  className="mt-1 text-center"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              3D Secure ile güvende ödeme
            </div>

            <Button
              type="submit"
              disabled={paying}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {paying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
              {paying ? "İşleniyor..." : `${selectedPlan ? fmt(selectedPlan.price) : ""} Öde`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Aboneliği İptal Et
            </DialogTitle>
            <DialogDescription>
              Aboneliğinizi iptal etmek istediğinizden emin misiniz? İptal sonrası premium ilanları göremezsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Vazgeç</Button>
            <Button
              variant="destructive"
              onClick={cancelSubscription}
              disabled={cancelling}
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Evet, İptal Et
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
