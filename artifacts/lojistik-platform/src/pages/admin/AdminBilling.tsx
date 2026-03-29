import { useState, useEffect, useRef } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  CreditCard, DollarSign, Edit2, Save, Loader2, Upload, Download,
  Trash2, RefreshCw, FileText, Users, CheckCircle2, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminBilling() {
  const { toast } = useToast();

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({ price: 0, name: "", badge: "", featuresText: "" });
  const [savingPlan, setSavingPlan] = useState(false);

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    userId: "",
    invoiceNo: "",
    amount: "",
    description: "",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [plansRes, invoicesRes, usersRes] = await Promise.all([
        fetch(api("/admin/plans"), { credentials: "include" }),
        fetch(api("/admin/invoices"), { credentials: "include" }),
        fetch(api("/users"), { credentials: "include" }),
      ]);
      const pd = await plansRes.json();
      const id = await invoicesRes.json();
      const ud = await usersRes.json();
      setPlans(pd.plans ?? []);
      setInvoices(id.invoices ?? []);
      setUsers((ud.users ?? []).filter((u: User) => u.role === "corporate"));
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
        setPlans(data.plans ?? plans);
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
      const res = await fetch(api("/admin/invoices"), { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Fatura Yüklendi", description: "Fatura başarıyla üyeye eklendi." });
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
      const res = await fetch(api(`/admin/invoices/${id}`), { method: "DELETE", credentials: "include" });
      if (res.ok) {
        toast({ title: "Fatura Silindi" });
        setInvoices(prev => prev.filter(i => i.id !== id));
      }
    } catch {
      toast({ title: "Silinemedi.", variant: "destructive" });
    }
  }

  function downloadInvoice(id: number, name: string) {
    const link = document.createElement("a");
    link.href = `${BASE}api/payment/invoices/${id}/download`;
    link.download = name;
    link.click();
  }

  const planColors: Record<string, string> = {
    starter: "from-slate-50 to-slate-100 border-slate-200",
    corporate: "from-blue-50 to-blue-100 border-blue-200",
    premium: "from-amber-50 to-amber-100 border-amber-200",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fatura & Abonelik Yönetimi</h1>
        <p className="text-slate-500 mt-1">Plan fiyatlarını düzenleyin, üyelere fatura yükleyin</p>
      </div>

      {/* ── Plan Fiyat Yönetimi ─────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg">Plan Fiyat Yönetimi</CardTitle>
          </div>
          <CardDescription>Abonelik planlarının fiyatlarını ve özelliklerini düzenleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(plan => (
              <div key={plan.id} className={`rounded-xl border p-4 bg-gradient-to-br ${planColors[plan.id] ?? "from-slate-50 to-slate-100 border-slate-200"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{plan.name}</h3>
                      {plan.highlighted && <Badge className="bg-blue-600 text-white border-0 text-xs">Öne Çıkan</Badge>}
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
                  {plan.features.slice(0, 4).map(f => (
                    <li key={f} className="text-xs text-slate-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                  {plan.features.length > 4 && (
                    <li className="text-xs text-slate-400">+{plan.features.length - 4} özellik daha</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Fatura Yükleme ──────────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Fatura Yönetimi</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadAll}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Yenile
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setUploadOpen(true)}>
                <Upload className="w-3.5 h-3.5 mr-1" /> Fatura Yükle
              </Button>
            </div>
          </div>
          <CardDescription>Kurumsal üyelere fatura dosyası yükleyin — üyeler kendi panellerinden indirebilir</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Henüz fatura yüklenmemiş</p>
              <p className="text-slate-400 text-sm mt-1">Üyelere fatura yüklemek için yukarıdaki butonu kullanın</p>
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
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => downloadInvoice(inv.id, inv.originalName)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
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
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={savingPlan}>
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
              <Upload className="w-4 h-4 text-blue-600" /> Fatura Yükle
            </DialogTitle>
            <DialogDescription>Kurumsal üyeye PDF veya belge yükleyin</DialogDescription>
          </DialogHeader>
          <form onSubmit={uploadInvoice} className="space-y-4">
            <div>
              <Label htmlFor="userId">Üye Seç</Label>
              <Select value={uploadForm.userId} onValueChange={v => setUploadForm(f => ({ ...f, userId: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Üye seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
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
                  placeholder="4999"
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
                placeholder="Nisan 2025 Kurumsal Plan"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Fatura Dosyası (PDF, max 10MB)</Label>
              <div
                className="mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {uploadFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <FileText className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">{uploadFile.name}</span>
                    <span className="text-xs text-slate-400">({fmtSize(uploadFile.size)})</span>
                    <button type="button" onClick={e => { e.stopPropagation(); setUploadFile(null); }}>
                      <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-500">
                    <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                    <p className="text-sm">Dosya seçmek için tıklayın</p>
                    <p className="text-xs text-slate-400">PDF, DOC, DOCX desteklenir</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setUploadOpen(false); setUploadFile(null); }}>
                Vazgeç
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={uploading || !uploadFile || !uploadForm.userId}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-1" /> Yükle</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
