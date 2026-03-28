import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
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
import {
  Building2, Bell, CreditCard, Shield, Save, Loader2,
  Mail, Phone, MapPin, Globe, Camera, CheckCircle2, AlertTriangle, Truck,
  Receipt, Landmark, Hash,
} from "lucide-react";

const VEHICLE_OPTIONS = [
  "Tır", "Kamyon", "Kamyonet", "Frigorifik", "Tenteli", "Lowbed",
  "Tanker", "Damperli", "Konteyner", "Kuru Yük", "Modüler Taşıt",
];

interface NotifState {
  newOffer: boolean;
  offerAccepted: boolean;
  shipmentUpdate: boolean;
  shipmentDelivered: boolean;
  paymentReminder: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
}

const DEFAULT_NOTIF: NotifState = {
  newOffer: true,
  offerAccepted: true,
  shipmentUpdate: true,
  shipmentDelivered: true,
  paymentReminder: false,
  smsEnabled: false,
  emailEnabled: true,
};

export default function CorporateSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    address: "",
    website: "",
    taxNumber: "",
  });

  const [logoPreview, setLogoPreview] = useState<string>("");
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotifState>(DEFAULT_NOTIF);
  const [billing, setBilling] = useState({
    invoiceTitle: "",
    taxOffice: "",
    billingAddress: "",
    billingEmail: "",
    iban: "",
    bankName: "",
    bankBranch: "",
  });

  useEffect(() => {
    if (!user) return;
    setProfile({
      companyName: user.company ?? "",
      contactName: user.name ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
      website: user.website ?? "",
      taxNumber: user.taxNumber ?? "",
    });
    if (user.avatarUrl) setLogoPreview(user.avatarUrl);
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
      } catch {
        /* ignore */
      }
    }
    if (user.billingInfo) {
      try {
        const parsed = JSON.parse(user.billingInfo);
        setBilling(prev => ({ ...prev, ...parsed }));
      } catch {
        /* ignore */
      }
    }
  }, [user]);

  const { mutate: updateUser, isPending: saving } = useUpdateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Ayarlar Kaydedildi", description: "Profil bilgileriniz başarıyla güncellendi." });
      },
      onError: (err: unknown) => {
        const message = (err as { data?: { message?: string } })?.data?.message ?? "Kayıt sırasında bir sorun oluştu.";
        toast({ title: "Hata", description: message, variant: "destructive" });
      },
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Dosya çok büyük", description: "Logo en fazla 2 MB olabilir.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const toggleVehicle = (v: string) => {
    setSelectedVehicles(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  };

  const toggleNotification = (key: keyof NotifState) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!user?.id) return;
    updateUser({
      id: user.id,
      data: {
        name: profile.contactName || undefined,
        phone: profile.phone || undefined,
        company: profile.companyName || undefined,
        avatarUrl: logoPreview || undefined,
        website: profile.website || undefined,
        address: profile.address || undefined,
        taxNumber: profile.taxNumber || undefined,
        vehicleTypes: JSON.stringify(selectedVehicles),
        notificationSettings: JSON.stringify(notifications),
        billingInfo: JSON.stringify(billing),
      },
    });
  };

  const initials = (profile.companyName || profile.contactName || "?")
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Hesap Ayarları</h1>
          <p className="text-muted-foreground mt-1">Şirket profili ve hesap tercihlerinizi yönetin</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Kaydet
        </Button>
      </div>

      {/* Company Profile */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Şirket Profili</CardTitle>
          </div>
          <CardDescription>Şirket bilgilerini güncel tutun</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Upload */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarImage src={logoPreview} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4" /> Logo Yükle
              </Button>
              {logoPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive block"
                  onClick={() => { setLogoPreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                >
                  Logoyu Kaldır
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG veya JPG, en fazla 2 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Şirket Adı</Label>
              <Input
                value={profile.companyName}
                onChange={e => setProfile(p => ({ ...p, companyName: e.target.value }))}
                placeholder="Şirket adı"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Yetkili Kişi</Label>
              <Input
                value={profile.contactName}
                onChange={e => setProfile(p => ({ ...p, contactName: e.target.value }))}
                placeholder="Ad Soyad"
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9 bg-muted/40 text-muted-foreground"
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                />
              </div>
              <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez</p>
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+90 5xx xxx xx xx"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vergi No</Label>
              <Input
                value={profile.taxNumber}
                onChange={e => setProfile(p => ({ ...p, taxNumber: e.target.value }))}
                placeholder="Vergi numaranız"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Web Sitesi</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={profile.website}
                  onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                  placeholder="www.siteniz.com"
                />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Adres</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={profile.address}
                  onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                  placeholder="İl, İlçe, Sokak..."
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Info */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-lg">Fatura Bilgileri</CardTitle>
          </div>
          <CardDescription>
            E-fatura ve resmi yazışmalar için kullanılacak bilgileri girin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Fatura Unvanı */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="font-medium">
                Fatura Unvanı
                <span className="text-xs text-muted-foreground font-normal ml-2">(Yasal ticaret unvanı)</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={billing.invoiceTitle}
                  onChange={e => setBilling(p => ({ ...p, invoiceTitle: e.target.value }))}
                  placeholder="Şirketin resmi ticaret unvanı"
                />
              </div>
            </div>

            {/* Vergi No & Vergi Dairesi */}
            <div className="space-y-1.5">
              <Label className="font-medium">Vergi Numarası</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={profile.taxNumber}
                  onChange={e => setProfile(p => ({ ...p, taxNumber: e.target.value }))}
                  placeholder="0000000000"
                  maxLength={11}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-medium">Vergi Dairesi</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={billing.taxOffice}
                  onChange={e => setBilling(p => ({ ...p, taxOffice: e.target.value }))}
                  placeholder="Örn: Kadıköy Vergi Dairesi"
                />
              </div>
            </div>

            {/* Fatura Adresi */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="font-medium">
                Fatura Adresi
                <span className="text-xs text-muted-foreground font-normal ml-2">(Şirket adresinden farklıysa)</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={billing.billingAddress}
                  onChange={e => setBilling(p => ({ ...p, billingAddress: e.target.value }))}
                  placeholder="İl, İlçe, Mahalle, Sokak, No..."
                />
              </div>
            </div>

            {/* Fatura E-postası */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="font-medium">Fatura E-postası</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="email"
                  value={billing.billingEmail}
                  onChange={e => setBilling(p => ({ ...p, billingEmail: e.target.value }))}
                  placeholder="fatura@sirketiniz.com"
                />
              </div>
              <p className="text-xs text-muted-foreground">Elektronik faturalar bu adrese gönderilecektir</p>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Banka Bilgileri */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold">Banka Bilgileri</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-medium">Banka Adı</Label>
                <Input
                  value={billing.bankName}
                  onChange={e => setBilling(p => ({ ...p, bankName: e.target.value }))}
                  placeholder="Örn: Ziraat Bankası"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-medium">Şube</Label>
                <Input
                  value={billing.bankBranch}
                  onChange={e => setBilling(p => ({ ...p, bankBranch: e.target.value }))}
                  placeholder="Şube adı veya kodu (isteğe bağlı)"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="font-medium">IBAN</Label>
                <div className="relative">
                  <Input
                    value={billing.iban}
                    onChange={e => {
                      const raw = e.target.value.replace(/\s/g, "").toUpperCase();
                      const formatted = raw.match(/.{1,4}/g)?.join(" ") ?? raw;
                      setBilling(p => ({ ...p, iban: formatted }));
                    }}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    className="font-mono tracking-wider"
                    maxLength={32}
                  />
                </div>
                {billing.iban && !/^TR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}$/.test(billing.iban.replace(/\s/g, "")) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Geçerli bir Türkiye IBAN'ı girin (TR ile başlamalı, 26 hane)
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Fleet */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-lg">Araç Filom</CardTitle>
          </div>
          <CardDescription>Çalıştığınız araç tiplerini seçin — şoförler ilanlarınızı filtrelerken görsün</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_OPTIONS.map(v => {
              const active = selectedVehicles.includes(v);
              return (
                <button
                  key={v}
                  onClick={() => toggleVehicle(v)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors
                    ${active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
                    }`}
                >
                  {v}
                  {active && <CheckCircle2 className="inline w-3.5 h-3.5 ml-1.5 -mt-0.5" />}
                </button>
              );
            })}
          </div>
          {selectedVehicles.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              {selectedVehicles.length} araç tipi seçildi: {selectedVehicles.join(", ")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Bildirim Ayarları</CardTitle>
          </div>
          <CardDescription>Hangi bildirimleri almak istediğinizi seçin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 mb-2">
            {[
              { key: "emailEnabled" as const, label: "E-posta Bildirimleri", icon: <Mail className="w-4 h-4" /> },
              { key: "smsEnabled" as const,   label: "SMS Bildirimleri",     icon: <Phone className="w-4 h-4" /> },
            ].map(ch => (
              <button
                key={ch.key}
                onClick={() => toggleNotification(ch.key)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors text-sm font-medium
                  ${notifications[ch.key]
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"}`}
              >
                {ch.icon}{ch.label}
                {notifications[ch.key] && <CheckCircle2 className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>

          <Separator />

          {[
            { key: "newOffer" as const,          label: "Yeni Teklif",           desc: "İlanınıza yeni teklif geldiğinde" },
            { key: "offerAccepted" as const,     label: "Teklif Kabulü",         desc: "Teklifiniz kabul/reddedildiğinde" },
            { key: "shipmentUpdate" as const,    label: "Taşıma Güncellemesi",   desc: "Sevkiyat durumu değiştiğinde" },
            { key: "shipmentDelivered" as const, label: "Teslim Bildirimi",      desc: "Yük teslim edildiğinde" },
            { key: "paymentReminder" as const,   label: "Ödeme Hatırlatması",    desc: "Ödeme tarihi yaklaştığında" },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <button
                onClick={() => toggleNotification(n.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${notifications[n.key] ? "bg-primary" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform
                  ${notifications[n.key] ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Billing */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Abonelik & Fatura</CardTitle>
            </div>
            <Link href="/dashboard/abonelik">
              <Button variant="outline" size="sm">Aboneliği Yönet</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Plan değişikliği, ödeme yönetimi ve fatura geçmişi için abonelik sayfasını ziyaret edin.
          </p>
          <Link href="/dashboard/abonelik">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Abonelik & Ödeme Sayfasına Git
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-lg">Güvenlik</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">OTP Doğrulama Aktif</span>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-200">Güvenli</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">İki Faktörlü Doğrulama</span>
            </div>
            <Button size="sm" variant="outline">Etkinleştir</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Tüm Değişiklikleri Kaydet
        </Button>
      </div>
    </div>
  );
}
