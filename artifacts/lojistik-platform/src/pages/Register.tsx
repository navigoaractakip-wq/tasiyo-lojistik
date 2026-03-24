import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck, Building2, Truck, ArrowLeft, ArrowRight,
  CheckCircle2, User, Mail, Phone, Briefcase, Loader2,
} from "lucide-react";

type Role = "corporate" | "driver";
type Step = "role" | "info" | "verify";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [identifier, setIdentifier] = useState("");
  const [identifierType, setIdentifierType] = useState<"email" | "phone">("email");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const { mutate: register, isPending } = useRegister();

  const stepIndex = step === "role" ? 0 : step === "info" ? 1 : 2;

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setStep("info");
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Hata", description: "İsim ve e-posta zorunludur.", variant: "destructive" });
      return;
    }
    if (role === "corporate" && !form.company.trim()) {
      toast({ title: "Hata", description: "Şirket adı zorunludur.", variant: "destructive" });
      return;
    }

    register(
      {
        data: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          role: role!,
          company: form.company.trim() || undefined,
        },
      },
      {
        onSuccess: (data) => {
          if (!data.success) {
            toast({ title: "Hata", description: data.message, variant: "destructive" });
            return;
          }
          setIdentifier(data.identifier ?? form.email);
          setIdentifierType(data.identifierType ?? "email");
          setRegistrationMessage(data.message);
          if (data.devCode) {
            setDevCode(data.devCode);
            setOtp(data.devCode);
          }
          setStep("verify");
        },
        onError: (err: unknown) => {
          const apiErr = err as { data?: { message?: string }; status?: number; message?: string };
          const msg = apiErr?.data?.message ?? apiErr?.message ?? "Kayıt sırasında bir hata oluştu.";
          const isConflict = apiErr?.status === 409;
          toast({
            title: isConflict ? "E-posta Zaten Kayıtlı" : "Hata",
            description: isConflict
              ? "Bu e-posta ile kayıtlı bir hesap var. Giriş sayfasından giriş yapabilirsiniz."
              : msg,
            variant: "destructive",
          });
          if (isConflict) {
            setTimeout(() => setLocation("/giris"), 3000);
          }
        },
      }
    );
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: "Hata", description: "6 haneli kodu eksiksiz girin.", variant: "destructive" });
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, identifierType, code: otp }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("auth_token", data.token);
        toast({ title: "Hoş geldiniz!", description: `Hesabınıza başarıyla giriş yapıldı.` });
        const target = data.user?.role === "corporate" ? "/dashboard" : "/driver";
        setLocation(target);
        window.location.reload();
      } else {
        toast({ title: "Hata", description: data.message || "Kod hatalı.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Hata", description: "Sunucu hatası oluştu.", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-[#1a2744] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-2xl shadow-blue-600/40">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TaşıYo</h1>
          <p className="text-blue-200/70 text-sm mt-1">Lojistik Platformu</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Rol", "Bilgiler", "Doğrulama"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-300 ${
                i < stepIndex
                  ? "bg-green-500 text-white"
                  : i === stepIndex
                  ? "bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-[#1a2744]"
                  : "bg-white/10 text-white/40"
              }`}>
                {i < stepIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === stepIndex ? "text-white" : "text-white/40"}`}>
                {label}
              </span>
              {i < 2 && <div className={`w-8 h-px ${i < stepIndex ? "bg-green-500" : "bg-white/20"}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Role Selection ── */}
            {step === "role" && (
              <motion.div key="role" {...pageVariants} transition={{ duration: 0.2 }} className="p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Hesap Türü Seçin</h2>
                <p className="text-sm text-gray-500 mb-6">Platforma nasıl katılmak istediğinizi seçin.</p>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleRoleSelect("corporate")}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-blue-50 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Kurumsal Kullanıcı</div>
                      <div className="text-sm text-gray-500">Yük ilanı oluşturun, taşıma talep edin</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 ml-auto transition-colors" />
                  </button>

                  <button
                    onClick={() => handleRoleSelect("driver")}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-orange-50 hover:border-orange-400 hover:bg-orange-50 transition-all group text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors flex-shrink-0">
                      <Truck className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Şoför / Bireysel</div>
                      <div className="text-sm text-gray-500">Yük ilanlarını görün, teklif verin ve kazanın</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-400 ml-auto transition-colors" />
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <span className="text-sm text-gray-500">Zaten hesabınız var mı? </span>
                  <button
                    onClick={() => setLocation("/giris")}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Giriş Yap
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Personal Info ── */}
            {step === "info" && (
              <motion.div key="info" {...pageVariants} transition={{ duration: 0.2 }} className="p-8">
                <button
                  onClick={() => setStep("role")}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Geri
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    role === "corporate" ? "bg-blue-100" : "bg-orange-100"
                  }`}>
                    {role === "corporate"
                      ? <Building2 className="w-5 h-5 text-blue-600" />
                      : <Truck className="w-5 h-5 text-orange-500" />
                    }
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Kişisel Bilgileriniz</h2>
                    <p className="text-xs text-gray-400">
                      {role === "corporate" ? "Kurumsal Hesap" : "Şoför / Bireysel Hesap"}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Ad Soyad <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="name"
                        className="pl-9"
                        placeholder="Ahmet Yılmaz"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      E-posta Adresi <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-9"
                        placeholder="ornek@sirket.com"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Telefon Numarası <span className="text-gray-400 font-normal">(opsiyonel)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        className="pl-9"
                        placeholder="+90 555 123 4567"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  {role === "corporate" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-1.5"
                    >
                      <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                        Şirket Adı <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="company"
                          className="pl-9"
                          placeholder="Şirket A.Ş."
                          value={form.company}
                          onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl mt-2"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Hesap Oluşturuluyor...</>
                    ) : (
                      <><ArrowRight className="w-4 h-4 mr-2" /> Devam Et</>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* ── Step 3: OTP Verify ── */}
            {step === "verify" && (
              <motion.div key="verify" {...pageVariants} transition={{ duration: 0.2 }} className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Hesabınız Oluşturuldu!</h2>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{registrationMessage}</p>
                </div>

                {devCode ? (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                      Geliştirme Modu — Test Kodu
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold tracking-[0.4em] text-amber-900 font-mono">
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
                    <p className="text-xs text-amber-600 mt-2">
                      SMTP/SMS yapılandırıldığında bu kutu görünmeyecek.
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-xs text-blue-700">
                      Doğrulama kodu {identifierType === "phone" ? "telefonunuza" : "e-postanıza"} gönderildi.
                    </p>
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                      6 Haneli Doğrulama Kodu
                    </Label>
                    <Input
                      className="text-center text-2xl font-bold tracking-[0.5em] h-14 rounded-xl border-2 focus:border-blue-500"
                      placeholder="• • • • • •"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                    disabled={verifying || otp.length !== 6}
                  >
                    {verifying ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Doğrulanıyor...</>
                    ) : (
                      "Giriş Yap"
                    )}
                  </Button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-4">
                  Giriş yapmak istemiyorsanız?{" "}
                  <button onClick={() => setLocation("/giris")} className="text-blue-600 hover:text-blue-700 font-medium">
                    Giriş sayfasına dön
                  </button>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Süper yönetici notu */}
        <p className="text-center text-xs text-blue-200/50 mt-6">
          Süper yönetici hesabı için yöneticinizle iletişime geçin.
        </p>
      </div>
    </div>
  );
}
