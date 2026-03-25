import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { sendOtp, verifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Truck, Mail, Phone, Loader2, ArrowLeft, Shield,
  Building2, ChevronRight,
} from "lucide-react";

type Step = "role" | "input" | "otp";
type IdentifierType = "phone" | "email";
type RoleHint = "admin" | "corporate" | "driver";

const ROLES = [
  {
    id: "corporate" as RoleHint,
    label: "Kurumsal Kullanıcı",
    desc: "Yük ilanı oluştur, teklifleri değerlendir, araçları takip et",
    icon: Building2,
    color: "from-blue-600 to-blue-800",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    btnClass: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30",
    hint: "",
    hintType: "email" as IdentifierType,
  },
  {
    id: "driver" as RoleHint,
    label: "Şoför / Bireysel",
    desc: "Sana uygun yükleri bul, teklif ver ve kazan",
    icon: Truck,
    color: "from-orange-500 to-orange-700",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    btnClass: "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/30",
    hint: "",
    hintType: "phone" as IdentifierType,
  },
];

const variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export default function Login() {
  const [, navigate] = useLocation();
  const { setToken, user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<RoleHint | null>(null);
  const [identifierType, setIdentifierType] = useState<IdentifierType>("email");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  if (user) {
    const target =
      user.role === "admin" ? "/admin" :
      user.role === "corporate" ? "/dashboard" :
      "/driver";
    navigate(target, { replace: true });
    return null;
  }

  const roleData = ROLES.find((r) => r.id === selectedRole);

  const handleRoleSelect = (role: typeof ROLES[0]) => {
    setSelectedRole(role.id);
    setIdentifierType(role.hintType);
    setIdentifier(role.hint);
    setStep("input");
  };

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      toast({ title: "Lütfen bilgilerinizi girin.", variant: "destructive" });
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
        } else {
          setDevCode(null);
        }
        toast({ title: "Kod Gönderildi", description: res.message });
      } else {
        toast({ title: "Hata", description: res.message, variant: "destructive" });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Bir hata oluştu.";
      toast({ title: "Hata", description: msg, variant: "destructive" });
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
        setToken(res.token);
        toast({ title: "Giriş Başarılı", description: `Hoş geldiniz, ${res.user?.name}!` });
        const target =
          res.user?.role === "admin" ? "/admin" :
          res.user?.role === "corporate" ? "/dashboard" :
          "/driver";
        navigate(target, { replace: true });
      } else {
        toast({ title: "Hata", description: res.message, variant: "destructive" });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Kod hatalı veya süresi dolmuş.";
      toast({ title: "Doğrulama Hatası", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-60 -left-40 w-[500px] h-[500px] rounded-full bg-blue-700/20 blur-3xl" />
        <div className="absolute -bottom-60 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/40">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-4xl font-extrabold text-white tracking-tight">TaşıYo</span>
          </div>
          <p className="text-slate-400 text-sm">Yeni Nesil Lojistik Platformu</p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Role Cards ── */}
          {step === "role" && (
            <motion.div key="role" {...variants} transition={{ duration: 0.25 }}>
              <p className="text-center text-slate-300 text-base font-medium mb-6">
                Hesap türünüzü seçerek giriş yapın
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
                {ROLES.map((role, i) => {
                  const Icon = role.icon;
                  return (
                    <motion.button
                      key={role.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => handleRoleSelect(role)}
                      className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl"
                    >
                      <div className={`w-14 h-14 rounded-2xl ${role.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-7 h-7 ${role.iconColor}`} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{role.label}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed mb-5">{role.desc}</p>
                      <div className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${role.btnClass}`}>
                        Giriş Yap <ChevronRight className="w-4 h-4" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-center text-sm text-slate-500 mt-8">
                Henüz hesabınız yok mu?{" "}
                <a href="/kayit" className="text-blue-400 hover:text-blue-300 font-semibold underline-offset-2 hover:underline">
                  Ücretsiz Kayıt Ol
                </a>
              </p>
            </motion.div>
          )}

          {/* ── Step 2: OTP Input ── */}
          {step === "input" && (
            <motion.div key="input" {...variants} transition={{ duration: 0.25 }} className="max-w-md mx-auto">
              <button
                onClick={() => setStep("role")}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Rol seçimine dön
              </button>

              <div className="bg-white rounded-2xl shadow-2xl p-8">
                {roleData && (
                  <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                    <div className={`w-11 h-11 rounded-xl ${roleData.iconBg} flex items-center justify-center`}>
                      <roleData.icon className={`w-5 h-5 ${roleData.iconColor}`} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{roleData.label}</p>
                      <p className="text-xs text-slate-400">Doğrulama kodu göndererek giriş yapın</p>
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  {/* Identifier type toggle */}
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    {(["email", "phone"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => { setIdentifierType(type); setIdentifier(type === "email" && roleData?.hint ? roleData.hint : ""); }}
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
                      placeholder={identifierType === "phone" ? "+90 555 123 4567" : "ornek@firma.com"}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      className="h-11 text-base"
                      autoFocus
                    />
                  </div>

                  <Button
                    className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gönderiliyor...</>
                      : "Doğrulama Kodu Gönder"
                    }
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: OTP Verify ── */}
          {step === "otp" && (
            <motion.div key="otp" {...variants} transition={{ duration: 0.25 }} className="max-w-md mx-auto">
              <button
                onClick={() => { setStep("input"); setOtp(""); setDevCode(null); }}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Geri dön
              </button>

              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-7 h-7 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Doğrulama Kodu</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">{identifier}</span> adresine gönderildi
                  </p>
                </div>

                {devCode && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-5">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
                      Geliştirme Modu — Test Kodu
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-3xl font-bold tracking-[0.4em] text-amber-900 font-mono">
                        {devCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtp(devCode)}
                        className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-800 font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Kullan
                      </button>
                    </div>
                    <p className="text-xs text-amber-600 mt-2">
                      SMTP/SMS yapılandırıldığında bu kutu görünmeyecek.
                    </p>
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
                    className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Doğrulanıyor...</>
                      : "Giriş Yap"
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

        <p className="text-center text-slate-600 text-xs mt-8">
          © {new Date().getFullYear()} TaşıYo Lojistik. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
