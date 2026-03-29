import { useState, useEffect, useRef } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DollarSign, Edit2, Save, Loader2, Upload, Download,
  Trash2, RefreshCw, FileText, CheckCircle2, X, Building2, Truck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

const BASE = import.meta.env.BASE_URL;
function api(path: string) { return `${BASE}api${path}`; }
function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString("tr-TR") + " ₺";
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}
function fmtSize(b: number | null | undefined) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  badge: string | null;
  highlighted: boolean;
  targetRole?: string;
}

interface Invoice {
  id: number;
  userId: number;
  invoiceNo: string | null;
  amount: number | null;
  currency: string;
  description: string | null;
  originalName: string;
  mimeType: string;
  fileSize: number | null;
  uploadedAt: string;
  transactionId: number | null;
  userName: string | null;
  userEmail: string | null;
  userRole?: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

type RoleTab = "corporate" | "driver";

const PLAN_COLORS: Record<string, string> = {
  starter: "from-slate-50 to-slate-100 border-slate-200",
  corporate: "from-blue-50 to-blue-100 border-blue-200",
  premium: "from-amber-50 to-amber-100 border-amber-200",
  driver_starter: "from-slate-50 to-slate-100 border-slate-200",
  driver_professional: "from-orange-50 to-orange-100 border-orange-200",
  driver_premium: "from-amber-50 to-amber-100 border-amber-200",
};

export default function AdminBilling() {
  const { toast } = useToast();
  const { token } = useAuth();

  function authHeaders(extra?: Record<string, string>) {
    return { Authorization: `Bearer ${token ?? ""}`, ...extra };
  }

  const [roleTab, setRoleTab] = useState<RoleTab>("corporate");

  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({ price: 0, name: "", badge: "", featuresText: "" });
  const [savingPlan, setSavingPlan] = useState(false);

  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    userId: "", invoiceNo: "", amount: "", description: "",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const plans = allPlans.filter(p => (p.targetRole ?? "corporate") === roleTab);
  const invoices = allInvoices.filter(i => i.userRole === roleTab);
  const users = allUsers.filter(u => u.role === roleTab);

  useEffect(() => { if (token) loadAll(); }, [token]);

  async function loadAll() {
    setLoading(true);
    try {
      const [plansRes, invoicesRes, usersRes] = await Promise.all([
        fetch(api("/admin/plans"), { headers: authHeaders() }),
        fetch(api("/admin/invoices"), { headers: authHeaders() }),
        fetch(api("/users"), { headers: authHeaders() }),
      ]);
      const pd = await plansRes.json();
      const id = await invoicesRes.json();
      const ud = await usersRes.json();
      setAllPlans(pd.plans ?? []);
      setAllInvoices(id.invoices ?? []);
      setAllUsers((ud.users ?? []).filter((u: User) => u.role === "corporate" || u.role === "driver"));
    } catch {
      toast({ title: "Hata", description: "Veriler yüklenemedi.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function openEditPlan(plan: Plan) {
    setEditingPlan(plan);
    setPlanForm({
      price: plan.price,
      name: plan.name,
      badge: plan.badge ?? "",
      featuresText: plan.features.join("\n"),
    });
  }

  async function savePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPlan) return;
    setSavingPlan(true);
    try {
      const res = await fetch(api(`/admin/plans/${editingPlan.id}`), {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: planForm.name,
          price: Number(planForm.price),
          badge: planForm.badge || null,
          features: planForm.featuresText.split("\n").map(l => l.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Plan Güncellendi", description: `${planForm.name} planı başarıyla kaydedildi.` });
        setAllPlans(prev => prev.map(p => {
          const updated = data.plans?.find((d: Plan) => d.id === p.id);
          return updated ? { ...updated, targetRole: p.targetRole } : p;
        }));
        setEditingPlan(null);
      } else {
        toast({ title: "Hata", description: data.error ?? "Güncellenemedi.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setSavingPlan(false);
    }
  }

  async function uploadInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !uploadForm.userId) {
      toast({ title: "Kullanıcı ve dosya zorunludur.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("userId", uploadForm.userId);
    fd.append("invoiceNo", uploadForm.invoiceNo);
    fd.append("amount", uploadForm.amount);
    fd.append("description", uploadForm.description);

    try {
      const res = await fetch(api("/admin/invoices"), { method: "POST", headers: authHeaders(), body: fd });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Fatura Yüklendi", description: "Fatura başarıyla yüklendi." });
        setUploadOpen(false);
        setUploadFile(null);
        setUploadForm({ userId: "", invoiceNo: "", amount: "", description: "" });
        loadAll();
      } else {
        toast({ title: "Hata", description: data.error ?? "Yüklenemedi.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function deleteInvoice(id: number) {
    if (!confirm("Bu faturayı silmek istediğinizden emin misiniz?")) return;
    try {
      const res = await fetch(api(`/admin/invoices/${id}`), { method: "DELETE", headers: authHeaders() });
      if (res.ok) {
        toast({ title: "Fatura Silindi" });
        setAllInvoices(prev => prev.filter(i => i.id !== id));
      }
    } catch {
      toast({ title: "Silinemedi.", variant: "destructive" });
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fatura & Abonelik Yönetimi</h1>
        <p className="text-slate-500 mt-1">Plan fiyatlarını düzenleyin, üyelere fatura yükleyin</p>
      </div>

      {/* ── Role Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setRoleTab("corporate")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            roleTab === "corporate"
              ? "bg-white shadow text-blue-700 border border-blue-100"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 className="w-4 h-4" /> Kurumsal
        </button>
        <button
          onClick={() => setRoleTab("driver")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            roleTab === "driver"
              ? "bg-white shadow text-orange-600 border border-orange-100"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Truck className="w-4 h-4" /> Sürücü
        </button>
      </div>

      {/* ── Plan Fiyat Yönetimi ─────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className={`w-5 h-5 ${roleTab === "driver" ? "text-orange-500" : "text-green-600"}`} />
            <CardTitle className="text-lg">
              {roleTab === "corporate" ? "Kurumsal Plan Fiyatları" : "Sürücü Plan Fiyatları"}
            </CardTitle>
          </div>
          <CardDescription>
            {roleTab === "corporate"
              ? "Kurumsal üyelerin abonelik planlarını düzenleyin"
              : "Sürücü abonelik planlarını düzenleyin — sürücüler ücretli plan ile premium ilanları görür"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Plan verisi yükleniyor...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-4 bg-gradient-to-br ${PLAN_COLORS[plan.id] ?? "from-slate-50 to-slate-100 border-slate-200"}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{plan.name}</h3>
                        {plan.highlighted && (
                          <Badge className={`${roleTab === "driver" ? "bg-orange-500" : "bg-blue-600"} text-white border-0 text-xs`}>
                            Öne Çıkan
                          </Badge>
                        )}
                      </div>
                      {plan.badge && <span className="text-xs text-slate-500">{plan.badge}</span>}
                    </div>
                    <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => openEditPlan(plan)}>
                      <Edit2 className="w-3 h-3 mr-1" /> Düzenle
                    </Button>
                  </div>
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-slate-900">
                      {plan.price === 0 ? "Ücretsiz" : `${plan.price.toLocaleString("tr-TR")} ₺`}
                    </span>
                    {plan.price > 0 && <span className="text-slate-500 text-sm">/ay</span>}
                  </div>
                  <ul className="space-y-1">
                    {plan.features.slice(0, 5).map(f => (
                      <li key={f} className="text-xs text-slate-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-xs text-slate-400">+{plan.features.length - 5} özellik daha</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Fatura Yönetimi ─────────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className={`w-5 h-5 ${roleTab === "driver" ? "text-orange-500" : "text-blue-600"}`} />
              <CardTitle className="text-lg">
                {roleTab === "corporate" ? "Kurumsal Fatura Yönetimi" : "Sürücü Fatura Yönetimi"}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadAll}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Yenile
              </Button>
              <Button
                size="sm"
                className={roleTab === "driver" ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}
                onClick={() => { setUploadForm({ userId: "", invoiceNo: "", amount: "", description: "" }); setUploadOpen(true); }}
              >
                <Upload className="w-3.5 h-3.5 mr-1" /> Fatura Yükle
              </Button>
            </div>
          </div>
          <CardDescription>
            {roleTab === "corporate"
              ? "Kurumsal üyelere fatura yükleyin — üyeler kendi panellerinden indirebilir"
              : "Sürücülere fatura yükleyin — sürücüler kendi abonelik sayfalarından indirebilir"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">
                {roleTab === "corporate" ? "Kurumsal" : "Sürücü"} faturası henüz yüklenmemiş
              </p>
              <p className="text-slate-400 text-sm mt-1">Fatura yüklemek için yukarıdaki butonu kullanın</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Tarih</TableHead>
                    <TableHead>Üye</TableHead>
                    <TableHead>Fatura No</TableHead>
                    <TableHead>Dosya</TableHead>
                    <TableHead>Boyut</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-center">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm text-slate-600">{fmtDate(inv.uploadedAt)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{inv.userName ?? "—"}</p>
                          <p className="text-xs text-slate-400">{inv.userEmail ?? ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-slate-600">{inv.invoiceNo ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-sm text-slate-700 max-w-[120px] truncate">{inv.originalName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{fmtSize(inv.fileSize)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(inv.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => downloadInvoice(inv.id, inv.originalName)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => deleteInvoice(inv.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Plan Düzenleme Modalı ────────────────────────────────────────────── */}
      <Dialog open={!!editingPlan} onOpenChange={o => !o && setEditingPlan(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-4 h-4" /> Plan Düzenle: {editingPlan?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={savePlan} className="space-y-4">
            <div>
              <Label htmlFor="planName">Plan Adı</Label>
              <Input
                id="planName"
                value={planForm.name}
                onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="planPrice">Aylık Fiyat (₺)</Label>
              <Input
                id="planPrice"
                type="number"
                min={0}
                step={1}
                value={planForm.price}
                onChange={e => setPlanForm(f => ({ ...f, price: Number(e.target.value) }))}
                className="mt-1"
                required
              />
              <p className="text-xs text-slate-400 mt-0.5">0 = Ücretsiz plan</p>
            </div>
            <div>
              <Label htmlFor="planBadge">Rozet Etiketi (opsiyonel)</Label>
              <Input
                id="planBadge"
                value={planForm.badge}
                onChange={e => setPlanForm(f => ({ ...f, badge: e.target.value }))}
                placeholder="Çok Tercih Edilen"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="planFeatures">Özellikler (her satıra bir özellik)</Label>
              <textarea
                id="planFeatures"
                value={planForm.featuresText}
                onChange={e => setPlanForm(f => ({ ...f, featuresText: e.target.value }))}
                rows={6}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                placeholder={"Sınırsız ilan\nÖncelikli destek\nGelişmiş analitik"}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingPlan(null)}>
                Vazgeç
              </Button>
              <Button
                type="submit"
                className={`flex-1 ${roleTab === "driver" ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}
                disabled={savingPlan}
              >
                {savingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Kaydet</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Fatura Yükleme Modalı ────────────────────────────────────────────── */}
      <Dialog open={uploadOpen} onOpenChange={o => { if (!o) { setUploadOpen(false); setUploadFile(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className={`w-4 h-4 ${roleTab === "driver" ? "text-orange-500" : "text-blue-600"}`} />
              {roleTab === "corporate" ? "Kurumsal Üyeye Fatura Yükle" : "Sürücüye Fatura Yükle"}
            </DialogTitle>
            <DialogDescription>
              {roleTab === "corporate" ? "Kurumsal" : "Sürücü"} üyeye PDF veya belge yükleyin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={uploadInvoice} className="space-y-4">
            <div>
              <Label htmlFor="userId">
                {roleTab === "corporate" ? "Kurumsal Üye" : "Sürücü"} Seç
              </Label>
              <Select value={uploadForm.userId} onValueChange={v => setUploadForm(f => ({ ...f, userId: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={`${roleTab === "corporate" ? "Kurumsal üye" : "Sürücü"} seçin...`} />
                </SelectTrigger>
                <SelectContent>
                  {users.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      {roleTab === "corporate" ? "Kurumsal üye" : "Sürücü"} bulunamadı
                    </SelectItem>
                  ) : (
                    users.map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name} — {u.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="invoiceNo">Fatura No</Label>
                <Input
                  id="invoiceNo"
                  value={uploadForm.invoiceNo}
                  onChange={e => setUploadForm(f => ({ ...f, invoiceNo: e.target.value }))}
                  placeholder="FAT-2025-001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="invoiceAmount">Tutar (₺)</Label>
                <Input
                  id="invoiceAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={uploadForm.amount}
                  onChange={e => setUploadForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="999"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="invoiceDesc">Açıklama (opsiyonel)</Label>
              <Input
                id="invoiceDesc"
                value={uploadForm.description}
                onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Nisan 2025 Profesyonel Plan"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Fatura Dosyası (PDF, max 10MB)</Label>
              <div
                className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  roleTab === "driver"
                    ? "hover:border-orange-400 hover:bg-orange-50"
                    : "hover:border-blue-400 hover:bg-blue-50"
                }`}
                onClick={() => fileRef.current?.click()}
              >
                {uploadFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <FileText className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">{uploadFile.name}</span>
                    <span className="text-xs text-slate-400">({fmtSize(uploadFile.size)})</span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setUploadFile(null); }}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <Upload className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <p className="text-sm">Tıklayın veya sürükleyin</p>
                    <p className="text-xs mt-0.5">PDF, DOC, DOCX — Maks 10MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf"
                className="hidden"
                onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setUploadOpen(false); setUploadFile(null); }}>
                Vazgeç
              </Button>
              <Button
                type="submit"
                className={`flex-1 ${roleTab === "driver" ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}
                disabled={uploading || !uploadFile || !uploadForm.userId}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-1" /> Yükle</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
