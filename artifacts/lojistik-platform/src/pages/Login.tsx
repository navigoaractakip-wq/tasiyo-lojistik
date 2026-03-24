import { useState } from "react";
import { useLocation } from "wouter";
import { sendOtp, verifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Truck, Mail, Phone, Loader2, ArrowLeft, Shield } from "lucide-react";

type Step = "input" | "otp";
type IdentifierType = "phone" | "email";

export default function Login() {
  const [, navigate] = useLocation();
  const { setToken, user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("input");
  const [identifierType, setIdentifierType] = useState<IdentifierType>("phone");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Already logged in — redirect
  if (user) {
    const target =
      user.role === "admin" ? "/admin" :
      user.role === "corporate" ? "/dashboard" :
      "/driver";
    navigate(target, { replace: true });
    return null;
  }

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      toast({ title: "Lütfen bilgilerinizi girin.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await sendOtp({
        identifier: identifier.trim(),
        identifierType,
      });
      if (res.success) {
        setStep("otp");
        if (res.devCode) {
          setDevCode(res.devCode);
          setOtp(res.devCode);
        } else {
          setDevCode(null);
        }
        toast({
          title: "Kod Gönderildi",
          description: res.message,
        });
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
      const res = await verifyOtp({
        identifier: identifier.trim(),
        identifierType,
        code: otp.trim(),
      });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">TaşıYo</h1>
          <p className="text-blue-200 mt-1">Lojistik Platformu</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {step === "otp" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -ml-1"
                  onClick={() => { setStep("input"); setOtp(""); }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div>
                <CardTitle className="text-xl">
                  {step === "input" ? "Giriş Yap" : "Doğrulama Kodu"}
                </CardTitle>
                <CardDescription>
                  {step === "input"
                    ? "Telefon numaranız veya e-posta adresinizle giriş yapın"
                    : `${identifier} adresine gönderilen 6 haneli kodu girin`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {step === "input" && (
              <>
                <Tabs
                  value={identifierType}
                  onValueChange={(v) => {
                    setIdentifierType(v as IdentifierType);
                    setIdentifier("");
                  }}
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="phone" className="flex-1 gap-2">
                      <Phone className="w-4 h-4" /> Telefon
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex-1 gap-2">
                      <Mail className="w-4 h-4" /> E-posta
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="phone" className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon Numarası</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+90 555 123 4567"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        Uluslararası format: +90 ile başlayan numara
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="email" className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta Adresi</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ornek@firma.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                        className="text-base"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  className="w-full h-11 text-base"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gönderiliyor...</>
                  ) : (
                    <>Doğrulama Kodu Gönder</>
                  )}
                </Button>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="flex items-center justify-center py-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                {devCode && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-1">
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
                )}

                <div className="space-y-2">
                  <Label htmlFor="otp">Doğrulama Kodu</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                    className="text-center text-2xl tracking-widest font-mono h-14"
                    autoFocus
                  />
                </div>

                <Button
                  className="w-full h-11 text-base"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Doğrulanıyor...</>
                  ) : (
                    "Giriş Yap"
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  Kodu Tekrar Gönder
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-blue-200/70 mt-2">
          Hesabınız yok mu?{" "}
          <a href="/kayit" className="font-semibold text-white hover:underline">
            Ücretsiz Kayıt Ol
          </a>
        </p>

        <p className="text-center text-blue-300/50 text-xs mt-4">
          © {new Date().getFullYear()} TaşıYo Lojistik. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
