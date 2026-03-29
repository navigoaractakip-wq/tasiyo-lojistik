import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useUpdateUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  User, Phone, Mail, Truck, Save, Loader2, Camera,
  CheckCircle2, AlertTriangle, Bell, Shield, Star,
  Package, Hash, Calendar, MapPin, FileText, Lock,
  CreditCard, Building2, Eye, EyeOff,
} from "lucide-react";

const VEHICLE_OPTIONS = [
  "Tır", "Kamyon", "Kamyonet", "Frigorifik", "Tenteli", "Lowbed",
  "Tanker", "Damperli", "Konteyner", "Kuru Yük", "Modüler Taşıt",
];

const DRIVER_DOC_TYPES = [
  { key: "k1",   label: "K1 Belgesi",   desc: "Tehlikeli madde taşıma" },
  { key: "src1", label: "SRC 1",        desc: "Tehlikeli madde taşıma" },
  { key: "src2", label: "SRC 2",        desc: "Yolcu taşıma" },
  { key: "src3", label: "SRC 3",        desc: "Karayolu yük taşıma" },
  { key: "src4", label: "SRC 4",        desc: "Ticari araç kullanma" },
  { key: "src5", label: "SRC 5",        desc: "Taksi / kiralık araç" },
  { key: "adr",  label: "ADR",          desc: "Tehlikeli madde (avrupa)" },
  { key: "psikoteknik", label: "Psikoteknik", desc: "Psikolojik yeterlilik" },
] as const;

type DocKey = (typeof DRIVER_DOC_TYPES)[number]["key"];

interface DocInfo {
  documentNo: string;
  issueDate: string;
  expiryDate: string;
}

type DocsState = Record<DocKey, DocInfo>;

const emptyDoc = (): DocInfo => ({ documentNo: "", issueDate: "", expiryDate: "" });

function defaultDocs(): DocsState {
  return Object.fromEntries(DRIVER_DOC_TYPES.map(d => [d.key, emptyDoc()])) as DocsState;
}

interface NotifState {
  newLoad: boolean;
  offerAccepted: boolean;
  offerRejected: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
}

const DEFAULT_NOTIF: NotifState = {
  newLoad: true,
  offerAccepted: true,
  offerRejected: true,
  smsEnabled: false,
  emailEnabled: true,
};

function SensitiveField({
  label, icon, maskedValue, placeholder, value, onChange, hint,
}: {
  label: string;
  icon: React.ReactNode;
  maskedValue?: string | null;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      {maskedValue && !value && (
        <div className="flex items-center gap-2 rounded-xl border bg-slate-50 px-3 h-11 text-sm text-slate-600 font-mono">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>{maskedValue}</span>
          <span className="ml-auto text-[10px] text-slate-400 font-sans">Kayıtlı (token)</span>
        </div>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={maskedValue ? "Güncellemek için yeni değer girin" : placeholder}
          className="pl-9 pr-10 rounded-xl h-11 font-mono"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow(p => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function DriverProfile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehiclePlate: "",
    address: "",
    taxOffice: "",
    taxNumber: "",
    driverLicense: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotifState>(DEFAULT_NOTIF);
  const [docs, setDocs] = useState<DocsState>(defaultDocs());

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      phone: user.phone ?? "",
      vehiclePlate: user.vehiclePlate ?? "",
      address: user.address ?? "",
      taxOffice: user.taxOffice ?? "",
      taxNumber: "",
      driverLicense: "",
    });
    if (user.avatarUrl) setAvatarPreview(user.avatarUrl);
    if (user.vehicleTypes) {
      try {
        setSelectedVehicles(JSON.parse(user.vehicleTypes));
      } catch {
        setSelectedVehicles(user.vehicleTypes.split(",").filter(Boolean));
      }
    }
    if (user.notificationSettings) {
      try {
        const parsed = JSON.parse(user.notificationSettings);
        setNotifications(prev => ({ ...prev, ...parsed }));
      } catch { }
    }
    if (user.driverDocuments) {
      try {
        const parsed = JSON.parse(user.driverDocuments);
        setDocs(prev => {
          const next = { ...prev };
          for (const key of Object.keys(parsed)) {
            if (key in next) next[key as DocKey] = { ...emptyDoc(), ...parsed[key] };
          }
          return next;
        });
      } catch { }
    }
  }, [user]);

  const { mutate: updateUser, isPending: saving } = useUpdateUser({
    mutation: {
      onSuccess: (data: any) => {
        refreshUser?.();
        setForm(prev => ({ ...prev, taxNumber: "", driverLicense: "" }));
        toast({ title: "Profil Güncellendi", description: "Bilgileriniz başarıyla kaydedildi." });
      },
      onError: (err: unknown) => {
        const msg = (err as { data?: { message?: string } })?.data?.message ?? "Kayıt sırasında bir hata oluştu.";
        toast({ title: "Hata", description: msg, variant: "destructive" });
      },
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Dosya çok büyük", description: "Fotoğraf en fazla 2 MB olabilir.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleVehicle = (v: string) => {
    setSelectedVehicles(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const toggleNotif = (key: keyof NotifState) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setDoc = (key: DocKey, field: keyof DocInfo, val: string) => {
    setDocs(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  };

  const handleSave = () => {
    if (!user?.id) return;
    const payload: Record<string, unknown> = {
      name: form.name || undefined,
      phone: form.phone || undefined,
      vehiclePlate: form.vehiclePlate || undefined,
      address: form.address || undefined,
      taxOffice: form.taxOffice || undefined,
      vehicleTypes: JSON.stringify(selectedVehicles),
      avatarUrl: avatarPreview || undefined,
      notificationSettings: JSON.stringify(notifications),
      driverDocuments: JSON.stringify(docs),
    };
    if (form.taxNumber.trim()) payload.taxNumber = form.taxNumber.trim();
    if (form.driverLicense.trim()) payload.driverLicense = form.driverLicense.trim();

    updateUser({ id: user.id, data: payload as any });
  };

  const initials = (form.name || "SF").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const hasAnyDoc = DRIVER_DOC_TYPES.some(d => docs[d.key]?.documentNo);

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-8 rounded-b-3xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Profilim</h1>
            <p className="text-blue-200 text-sm">Kişisel, araç ve belge bilgilerinizi yönetin</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="bg-white text-primary hover:bg-blue-50 font-semibold gap-2 rounded-xl shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Kaydet
          </Button>
        </div>

        {/* Avatar */}
        <div className="flex items-end gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-white/30 shadow-lg">
              <AvatarImage src={avatarPreview} />
              <AvatarFallback className="bg-white/20 text-white text-2xl font-bold backdrop-blur">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent rounded-full border-2 border-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">{form.name || "Şoför"}</p>
            <p className="text-blue-200 text-sm">{user?.phone ?? user?.email ?? ""}</p>
            {user?.isPhoneVerified ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-300 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Telefon doğrulandı
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-300 mt-0.5">
                <AlertTriangle className="w-3 h-3" /> Telefon doğrulanmadı
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-1 space-y-4 pb-8">

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">
                {user?.rating != null ? Number(user.rating).toFixed(1) : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">Puan</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Package className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{user?.totalShipments ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Taşıma</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Calendar className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">
                {user?.createdAt ? format(new Date(user.createdAt), "MMM yy", { locale: tr }) : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">Üyelik</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Kişisel Bilgiler ───────────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Kişisel Bilgiler</CardTitle>
                <CardDescription className="text-xs">Ad, telefon ve adres bilgileri</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ad Soyad</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Adınız ve soyadınız"
                  className="pl-9 rounded-xl h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+90 5XX XXX XX XX"
                  type="tel"
                  className="pl-9 rounded-xl h-11"
                />
              </div>
              {user?.isPhoneVerified ? (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Telefon doğrulanmış
                </p>
              ) : (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Telefon henüz doğrulanmadı
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={user?.email ?? ""}
                  disabled
                  className="pl-9 rounded-xl h-11 bg-gray-50 text-muted-foreground cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adres</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Açık adresiniz"
                  className="pl-9 rounded-xl h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Mali / Yasal Bilgiler ──────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base">Mali & Yasal Bilgiler</CardTitle>
                <CardDescription className="text-xs">
                  Vergi no ve ehliyet no şifreli (token) olarak saklanır — sadece son 4 hanesi görünür
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vergi Dairesi</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.taxOffice}
                  onChange={e => setForm(p => ({ ...p, taxOffice: e.target.value }))}
                  placeholder="Örn: Kadıköy Vergi Dairesi"
                  className="pl-9 rounded-xl h-11"
                />
              </div>
            </div>

            <SensitiveField
              label="Vergi Numarası"
              icon={<CreditCard className="w-4 h-4" />}
              maskedValue={user?.taxNumber}
              placeholder="10 haneli vergi numarası"
              value={form.taxNumber}
              onChange={v => setForm(p => ({ ...p, taxNumber: v }))}
              hint="Kaydedildiğinde şifrelenerek (token) saklanır. Güncellemek için yeni değer girin."
            />

            <SensitiveField
              label="Ehliyet Numarası"
              icon={<FileText className="w-4 h-4" />}
              maskedValue={user?.driverLicenseMasked}
              placeholder="Ehliyet numaranız"
              value={form.driverLicense}
              onChange={v => setForm(p => ({ ...p, driverLicense: v }))}
              hint="Kaydedildiğinde şifrelenerek (token) saklanır. Güncellemek için yeni değer girin."
            />
          </CardContent>
        </Card>

        {/* ── Araç Bilgileri ─────────────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                <Truck className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base">Araç Bilgileri</CardTitle>
                <CardDescription className="text-xs">Araç tipi ve plaka bilgisi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plaka</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.vehiclePlate}
                  onChange={e => setForm(p => ({ ...p, vehiclePlate: e.target.value.toUpperCase() }))}
                  placeholder="34 ABC 123"
                  className="pl-9 rounded-xl h-11 font-mono tracking-widest uppercase"
                  maxLength={12}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Araç Tipleri
                {selectedVehicles.length > 0 && (
                  <span className="ml-2 text-primary font-semibold normal-case">
                    ({selectedVehicles.length} seçili)
                  </span>
                )}
              </Label>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_OPTIONS.map(v => {
                  const selected = selectedVehicles.includes(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => toggleVehicle(v)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selected
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      {selected && <span className="mr-1">✓</span>}
                      {v}
                    </button>
                  );
                })}
              </div>
              {selectedVehicles.length === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> En az bir araç tipi seçmelisiniz
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Sürücü Belgeleri ───────────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Sürücü Belgeleri</CardTitle>
                <CardDescription className="text-xs">
                  K1, SRC ve diğer yetki belgelerinizin bilgilerini girin
                  {hasAnyDoc && (
                    <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-3 h-3" /> Belgeler kaydedildi
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {DRIVER_DOC_TYPES.map((docType, idx) => {
              const doc = docs[docType.key];
              const hasData = doc.documentNo || doc.issueDate || doc.expiryDate;
              return (
                <div key={docType.key}>
                  {idx > 0 && <Separator className="mb-5" />}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      hasData ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"
                    }`}>
                      {hasData ? <CheckCircle2 className="w-3.5 h-3.5" /> : (idx + 1)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{docType.label}</p>
                      <p className="text-[11px] text-slate-400">{docType.desc}</p>
                    </div>
                    {hasData && (
                      <Badge className="ml-auto bg-green-100 text-green-700 border-green-200 text-[10px]">Dolu</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-8">
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Belge No</Label>
                      <Input
                        value={doc.documentNo}
                        onChange={e => setDoc(docType.key, "documentNo", e.target.value)}
                        placeholder="Belge numarası"
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Düzenlenme Tarihi</Label>
                      <Input
                        type="date"
                        value={doc.issueDate}
                        onChange={e => setDoc(docType.key, "issueDate", e.target.value)}
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Son Geçerlilik</Label>
                      <Input
                        type="date"
                        value={doc.expiryDate}
                        onChange={e => setDoc(docType.key, "expiryDate", e.target.value)}
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ── Bildirim Ayarları ─────────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                <Bell className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base">Bildirim Ayarları</CardTitle>
                <CardDescription className="text-xs">Hangi bildirimleri almak istediğinizi seçin</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {([
              { key: "newLoad",       label: "Yeni yük ilanı",        desc: "Bölgenizdeki yeni ilanlar için" },
              { key: "offerAccepted", label: "Teklifim kabul edildi", desc: "Teklif kabulü bildirimi"        },
              { key: "offerRejected", label: "Teklifim reddedildi",   desc: "Teklif reddi bildirimi"         },
            ] as { key: keyof NotifState; label: string; desc: string }[]).map(({ key, label, desc }, i, arr) => (
              <div key={key}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotif(key)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      notifications[key] ? "bg-primary" : "bg-gray-200"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      notifications[key] ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
                {i < arr.length - 1 && <Separator />}
              </div>
            ))}

            <Separator className="my-2" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1 pb-2">Bildirim Kanalı</p>
            {([
              { key: "smsEnabled",   label: "SMS Bildirimleri",     desc: "Telefon numaranıza SMS gönder" },
              { key: "emailEnabled", label: "E-posta Bildirimleri", desc: "E-posta adresinize gönder"    },
            ] as { key: keyof NotifState; label: string; desc: string }[]).map(({ key, label, desc }, i, arr) => (
              <div key={key}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotif(key)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      notifications[key] ? "bg-primary" : "bg-gray-200"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      notifications[key] ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
                {i < arr.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Hesap Durumu ──────────────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Hesap Durumu</CardTitle>
                <CardDescription className="text-xs">Hesabınız hakkında bilgiler</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-muted-foreground">Hesap Durumu</span>
              <Badge className={
                user?.status === "active"    ? "bg-green-100 text-green-700 border-green-200" :
                user?.status === "suspended" ? "bg-red-100 text-red-700 border-red-200" :
                "bg-amber-100 text-amber-700 border-amber-200"
              }>
                {user?.status === "active" ? "Aktif" : user?.status === "suspended" ? "Askıya Alındı" : "Beklemede"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-muted-foreground">Telefon Doğrulama</span>
              {user?.isPhoneVerified ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Doğrulandı
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                  <AlertTriangle className="w-3 h-3" /> Doğrulanmadı
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-muted-foreground">Ehliyet Kaydı</span>
              {user?.driverLicenseMasked ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                  <Lock className="w-3 h-3" /> {user.driverLicenseMasked}
                </Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-500 border-slate-200">Girilmedi</Badge>
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-muted-foreground">Kullanıcı Rolü</span>
              <Badge variant="outline">Bireysel Şoför</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Üyelik Tarihi</span>
              <span className="text-sm font-medium">
                {user?.createdAt ? format(new Date(user.createdAt), "d MMMM yyyy", { locale: tr }) : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Kaydet Butonu (Alt) */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl gap-2 text-base font-semibold shadow-md"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Değişiklikleri Kaydet
        </Button>
      </div>
    </div>
  );
}
