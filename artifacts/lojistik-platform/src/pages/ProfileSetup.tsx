import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Building2, Phone, Truck, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = (import.meta.env.BASE_URL + "api/").replace(/\/+/g, "/").replace(":/", "://");

function apiUrl(path: string) {
  return BASE + path;
}

export default function ProfileSetup() {
  const { user, role, token, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<"info" | "otp" | "driver" | "done">("info");

  // Corporate fields
  const [company, setCompany] = useState(user?.company ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  // OTP
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Driver fields
  const [vehiclePlate, setVehiclePlate] = useState(user?.vehiclePlate ?? "");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(
    user?.vehicleTypes ? user.vehicleTypes.split(",").map((s) => s.trim()).filter(Boolean) : []
  );

  const [saving, setSaving] = useState(false);

  const VEHICLE_OPTIONS = [
    "Kamyon", "TIR", "Kamyonet", "Frigorifik", "Tenteli", "Tanker",
    "Konteyner", "Kuru Yük", "Lowbed", "Damper",
  ];

  useEffect(() => {
    if (!user || !role) return;
    if (role === "corporate") {
      if (!user.company || !user.address || !user.phone) {
        setStep("info");
      } else if (!user.isPhoneVerified) {
        setStep("otp");
      } else {
        navigate(role === "corporate" ? "/dashboard" : "/driver");
      }
    } else if (role === "driver") {
      if (!user.vehicleTypes || !user.vehiclePlate) {
        setStep("driver");
      } else {
        navigate("/driver");
      }
    } else {
      navigate("/");
    }
  }, [user, role]);

  async function saveCorporateInfo() {
    if (!company.trim() || !address.trim() || !phone.trim()) {
      toast({ title: "Eksik bilgi", description: "Lütfen tüm alanları doldurun.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`users/${user!.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ company: company.trim(), address: address.trim(), phone: phone.trim() }),
      });
      if (!res.ok) throw new Error("Kayıt hatası");
      await refreshUser();
      // After refresh, check if phone is verified
      const data = await res.json();
      if (!data.isPhoneVerified) {
        await sendPhoneOtp();
        setStep("otp");
      } else {
        navigate("/dashboard");
      }
    } catch {
      toast({ title: "Hata", description: "Bilgiler kaydedilemedi. Lütfen tekrar deneyin.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function sendPhoneOtp() {
    setSendingOtp(true);
    try {
      const res = await fetch(apiUrl("auth/send-phone-otp"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.devCode) {
        setDevCode(data.devCode);
        toast({ title: "Geliştirici modu", description: `OTP kodu: ${data.devCode}` });
      } else {
        toast({ title: "Kod gönderildi", description: data.message });
      }
    } catch {
      toast({ title: "Hata", description: "OTP gönderilemedi.", variant: "destructive" });
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyPhoneOtp() {
    if (!otp.trim() || otp.trim().length !== 6) {
      toast({ title: "Hatalı kod", description: "6 haneli doğrulama kodunu girin.", variant: "destructive" });
      return;
    }
    setVerifyingOtp(true);
    try {
      const res = await fetch(apiUrl("auth/verify-phone"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Doğrulama başarısız", description: data.message ?? "Kod hatalı veya süresi dolmuş.", variant: "destructive" });
        return;
      }
      await refreshUser();
      toast({ title: "Telefon doğrulandı!", description: "Profil kurulumunuz tamamlandı." });
      navigate("/dashboard");
    } catch {
      toast({ title: "Hata", description: "Doğrulama yapılamadı.", variant: "destructive" });
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function saveDriverInfo() {
    if (!vehiclePlate.trim() || vehicleTypes.length === 0) {
      toast({ title: "Eksik bilgi", description: "Araç tipi seçin ve plaka girin.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`users/${user!.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vehiclePlate: vehiclePlate.trim().toUpperCase(), vehicleTypes: vehicleTypes.join(", ") }),
      });
      if (!res.ok) throw new Error("Kayıt hatası");
      await refreshUser();
      toast({ title: "Profil tamamlandı!", description: "Artık teklif verebilirsiniz." });
      navigate("/driver");
    } catch {
      toast({ title: "Hata", description: "Bilgiler kaydedilemedi.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function toggleVehicleType(v: string) {
    setVehicleTypes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {role === "corporate" ? <Building2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-lg font-bold">Profil Kurulumu</h1>
              <p className="text-blue-100 text-sm">
                {role === "corporate" ? "Kurumsal hesap doğrulaması" : "Şoför profil bilgileri"}
              </p>
            </div>
          </div>
          {/* Steps indicator for corporate */}
          {role === "corporate" && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <div className={`flex items-center gap-1 ${step === "info" ? "text-white" : "text-blue-200"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "info" ? "bg-white text-blue-600" : step === "otp" ? "bg-blue-400" : "bg-green-400"}`}>
                  {step === "otp" || step === "done" ? <CheckCircle2 className="w-4 h-4" /> : "1"}
                </div>
                <span>Firma Bilgileri</span>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-300" />
              <div className={`flex items-center gap-1 ${step === "otp" ? "text-white" : "text-blue-200"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "otp" ? "bg-white text-blue-600" : step === "done" ? "bg-green-400" : "bg-blue-400/50"}`}>
                  {step === "done" ? <CheckCircle2 className="w-4 h-4" /> : "2"}
                </div>
                <span>Telefon Doğrulama</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* ─── Corporate: Step 1 - Company Info ─── */}
          {step === "info" && role === "corporate" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Firma Bilgilerinizi Girin</h2>
                <p className="text-sm text-gray-500 mt-1">
                  İlan oluşturabilmek için firma bilgilerinizi ve telefon numaranızı doğrulamanız gerekiyor.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company">Firma / Şirket Adı *</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Örn: Yıldız Lojistik A.Ş."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adres *</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Örn: Atatürk Mah. No:12, Pendik, İstanbul"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon Numarası *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">Bu numaraya doğrulama kodu gönderilecektir.</p>
                </div>
              </div>
              <Button onClick={saveCorporateInfo} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Kaydet ve Devam Et
              </Button>
            </div>
          )}

          {/* ─── Corporate: Step 2 - Phone OTP ─── */}
          {step === "otp" && role === "corporate" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Telefon Doğrulama</h2>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium text-gray-700">{user?.phone || phone}</span> numarasına gönderilen 6 haneli kodu girin.
                </p>
              </div>
              {devCode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Geliştirici modu:</strong> SMS gönderilmedi. Kod: <strong className="font-mono text-lg">{devCode}</strong>
                  </p>
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="otp">Doğrulama Kodu</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="_ _ _ _ _ _"
                    maxLength={6}
                    className="mt-1 text-center text-2xl font-mono tracking-widest"
                  />
                </div>
                <Button onClick={verifyPhoneOtp} disabled={verifyingOtp} className="w-full">
                  {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
                  Kodu Doğrula
                </Button>
                <Button
                  variant="ghost"
                  onClick={sendPhoneOtp}
                  disabled={sendingOtp}
                  className="w-full text-sm text-gray-500"
                >
                  {sendingOtp ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  Kodu tekrar gönder
                </Button>
              </div>
            </div>
          )}

          {/* ─── Driver: Vehicle Info ─── */}
          {step === "driver" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Araç Bilgilerinizi Girin</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Teklif verebilmek için araç tipi ve plaka bilgilerinizi ekleyin.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Araç Tipi(leri) *</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {VEHICLE_OPTIONS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggleVehicleType(v)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          vehicleTypes.includes(v)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {vehicleTypes.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">Seçilen: {vehicleTypes.join(", ")}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="plate">Araç Plakası *</Label>
                  <Input
                    id="plate"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="34 ABC 1234"
                    className="mt-1 font-mono"
                  />
                </div>
              </div>
              <Button onClick={saveDriverInfo} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                Profili Tamamla
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
