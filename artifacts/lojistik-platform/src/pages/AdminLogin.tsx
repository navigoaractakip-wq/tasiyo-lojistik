import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { sendOtp, verifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { usePlatformBranding } from "@/lib/platform-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Truck, Mail, Phone, Loader2, ArrowLeft, Shield, ShieldCheck,
} from "lucide-react";

type Step = "input" | "otp";
type IdentifierType = "phone" | "email";

const variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -16 },
};

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const { setToken, user } = useAuth();
  const branding = usePlatformBranding();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("input");
  const [identifierType, setIdentifierType] = useState<IdentifierType>("email");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  if (user) {
    const target =
      user.role === "admin" ? "/admin" :
      user.role === "corporate" ? "/dashboard" : "/driver";
    navigate(target, { replace: true });
    return null;
  }

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      toast({ title: "E-posta veya telefon girin.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await sendOtp({ identifier: identifier.trim(), identifierType });
      if (res.success) {
        setStep("otp");
        if (res.devCode) {
          setDevCode(res.devCode);
          setOtp(res.devCode);
        }
        toast({ title: "Kod Gönderildi", description: res.message });
      } else {
        toast({ title: "Hata", description: res.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Hata", description: err?.response?.data?.message ?? "Bir hata oluştu.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: "Geçersiz Kod", description: "6 haneli kodu giriniz.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp({ identifier: identifier.trim(), identifierType, code: otp.trim() });
      if (res.success && res.token) {
        if (res.user?.role !== "admin") {
          toast({ title: "Erişim Reddedildi", description: "Bu giriş yalnızca yöneticiler içindir.", variant: "destructive" });
          setLoading(false);
          return;
        }
        setToken(res.token);
        toast({ title: "Giriş Başarılı", description: `Hoş geldiniz, ${res.user?.name}!` });
        navigate("/admin", { replace: true });
      } else {
        toast({ title: "Hata", description: res.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Doğrulama Hatası", description: err?.response?.data?.message ?? "Kod hatalı veya süresi dolmuş.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-60 -left-40 w-[500px] h-[500px] rounded-full bg-slate-700/20 blur-3xl" />
        <div className="absolute -bottom-60 -right-40 w-[500px] h-[500px] rounded-full bg-slate-600/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 mb-2">
            {branding.logoLight ? (
              <img src={branding.logoLight} alt="Logo" className="h-10 w-10 object-contain" />
            ) : branding.logo ? (
              <img src={branding.logo} alt="Logo" className="h-10 w-10 object-contain" />
            ) : (
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="h-10 w-10 object-contain" />
            )}
            <span className="text-3xl font-extrabold text-white tracking-tight">{branding.name}</span>
          </div>
          <p className="text-slate-500 text-sm">Yönetici Girişi</p>
        </motion.div>

        {/* Admin badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Süper Yönetici Paneli</span>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Identifier Input ── */}
          {step === "input" && (
            <motion.div key="input" {...variants} transition={{ duration: 0.25 }}>
              <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-5">
                {/* Identifier type toggle */}
                <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  {(["email", "phone"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => { setIdentifierType(type); setIdentifier(""); }}
                      className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        identifierType === type
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {type === "phone" ? <Phone className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                      {type === "phone" ? "Telefon" : "E-posta"}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">
                    {identifierType === "phone" ? "Telefon Numarası" : "E-posta Adresi"}
                  </Label>
                  <Input
                    type={identifierType === "phone" ? "tel" : "email"}
                    placeholder={identifierType === "phone" ? "+90 555 000 0000" : "yonetici@firma.com"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    className="h-11"
                    autoFocus
                  />
                </div>

                <Button
                  className="w-full h-11 text-sm font-semibold bg-slate-800 hover:bg-slate-700"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gönderiliyor...</>
                    : "Doğrulama Kodu Gönder"
                  }
                </Button>

                <button
                  type="button"
                  onClick={() => navigate("/giris")}
                  className="w-full text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 pt-1 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Normal girişe dön
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: OTP Verify ── */}
          {step === "otp" && (
            <motion.div key="otp" {...variants} transition={{ duration: 0.25 }}>
              <button
                onClick={() => { setStep("input"); setOtp(""); setDevCode(null); }}
                className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors mb-4 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Geri dön
              </button>

              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <div className="text-center mb-5">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-slate-700" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Doğrulama Kodu</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">{identifier}</span> adresine gönderildi
                  </p>
                </div>

                {devCode && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-4">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                      Geliştirme Modu — Test Kodu
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-2xl font-bold tracking-[0.4em] text-amber-900 font-mono">
                        {devCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtp(devCode)}
                        className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-800 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Kullan
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">6 Haneli Kod</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                      className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                      autoFocus
                    />
                  </div>

                  <Button
                    className="w-full h-11 font-semibold bg-slate-800 hover:bg-slate-700"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Doğrulanıyor...</>
                      : "Yönetici Girişi Yap"
                    }
                  </Button>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full text-sm text-slate-400 hover:text-slate-600 py-1 transition-colors disabled:opacity-50"
                  >
                    Kodu tekrar gönder
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        <p className="text-center text-slate-700 text-xs mt-6">
          © {new Date().getFullYear()} TaşıYo Lojistik. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
