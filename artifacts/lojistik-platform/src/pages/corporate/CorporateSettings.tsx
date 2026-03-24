import { useState, useEffect } from "react";
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
  Building2, User, Bell, CreditCard, Shield, Save, Loader2,
  Mail, Phone, MapPin, Globe, Camera, CheckCircle2, AlertTriangle,
} from "lucide-react";

export default function CorporateSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    address: "",
    website: "",
    taxNumber: "",
  });

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        companyName: user.company ?? "",
        contactName: user.name ?? "",
        phone: user.phone ?? "",
      }));
    }
  }, [user]);

  const [notifications, setNotifications] = useState({
    newOffer: true,
    offerAccepted: true,
    shipmentUpdate: true,
    shipmentDelivered: true,
    paymentReminder: false,
    smsEnabled: false,
    emailEnabled: true,
  });

  const { mutate: updateUser, isPending: saving } = useUpdateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Ayarlar Kaydedildi", description: "Profil bilgileriniz başarıyla güncellendi." });
      },
      onError: (err: any) => {
        toast({
          title: "Hata",
          description: err?.data?.message ?? "Kayıt sırasında bir sorun oluştu.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSave = () => {
    if (!user?.id) return;
    updateUser({
      id: user.id,
      data: {
        name: profile.contactName || undefined,
        phone: profile.phone || undefined,
        company: profile.companyName || undefined,
      },
    });
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {(profile.companyName || profile.contactName || "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="gap-2">
              <Camera className="w-4 h-4" /> Logo Yükle
            </Button>
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
                  title="E-posta adresi değiştirilemez"
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
          {/* Channels */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            {[
              { key: "emailEnabled", label: "E-posta Bildirimleri", icon: <Mail className="w-4 h-4" /> },
              { key: "smsEnabled",   label: "SMS Bildirimleri",     icon: <Phone className="w-4 h-4" /> },
            ].map(ch => (
              <button
                key={ch.key}
                onClick={() => toggleNotification(ch.key as keyof typeof notifications)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors text-sm font-medium
                  ${notifications[ch.key as keyof typeof notifications]
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"}`}
              >
                {ch.icon}{ch.label}
                {notifications[ch.key as keyof typeof notifications] && (
                  <CheckCircle2 className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))}
          </div>

          <Separator />

          {[
            { key: "newOffer",          label: "Yeni Teklif",           desc: "İlanınıza yeni teklif geldiğinde" },
            { key: "offerAccepted",     label: "Teklif Kabulü",         desc: "Teklifiniz kabul/reddedildiğinde" },
            { key: "shipmentUpdate",    label: "Taşıma Güncellemesi",   desc: "Sevkiyat durumu değiştiğinde" },
            { key: "shipmentDelivered", label: "Teslim Bildirimi",      desc: "Yük teslim edildiğinde" },
            { key: "paymentReminder",   label: "Ödeme Hatırlatması",    desc: "Ödeme tarihi yaklaştığında" },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <button
                onClick={() => toggleNotification(n.key as keyof typeof notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${notifications[n.key as keyof typeof notifications] ? "bg-primary" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform
                  ${notifications[n.key as keyof typeof notifications] ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Billing */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg">Abonelik & Fatura</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold">Kurumsal Plan</p>
                <Badge className="bg-blue-600 text-white border-0">Aktif</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Sınırsız ilan · Öncelikli destek · Gelişmiş analitik</p>
              <p className="text-xs text-muted-foreground mt-1">Sonraki ödeme: 15 Nisan 2026</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">4.999 ₺</p>
              <p className="text-xs text-muted-foreground">/ay</p>
            </div>
          </div>
          <Button variant="outline" className="mt-3 w-full">Fatura Geçmişini Görüntüle</Button>
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
