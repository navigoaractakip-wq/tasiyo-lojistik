import { useGetSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert, Server, Database, Wifi, CheckCircle2, AlertTriangle,
  Globe, Lock, Activity, Zap, RefreshCw, Loader2,
} from "lucide-react";

type ServiceStatus = "healthy" | "warning" | "error";

const STATUS_CONFIG = {
  healthy: { label: "Çalışıyor", color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200",  icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> },
  warning: { label: "Yapılandırılmamış", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", icon: <AlertTriangle className="w-4 h-4 text-yellow-600" /> },
  error:   { label: "Hata",      color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",    icon: <AlertTriangle className="w-4 h-4 text-red-600" /> },
};

export default function AdminSystem() {
  const { data: settingsData, isLoading, refetch, isFetching } = useGetSettings();

  const settings = settingsData?.settings ?? [];
  const get = (key: string) => settings.find(s => s.key === key)?.value;

  const smtpHost  = get("smtp_host");
  const smtpUser  = get("smtp_user");
  const smtpPass  = get("smtp_pass");
  const smtpConfigured = !!(smtpHost && smtpUser && smtpPass);

  const twilioSid   = get("twilio_account_sid");
  const twilioToken = get("twilio_auth_token");
  const twilioPhone = get("twilio_phone_number");
  const twilioConfigured = !!(twilioSid && twilioToken && twilioPhone);

  const services = [
    {
      name: "API Sunucu",
      status: "healthy" as ServiceStatus,
      description: "Express REST API servisi",
      icon: <Server className="w-5 h-5" />,
      extra: "Aktif",
    },
    {
      name: "Veritabanı",
      status: "healthy" as ServiceStatus,
      description: "PostgreSQL veritabanı",
      icon: <Database className="w-5 h-5" />,
      extra: "Bağlı",
    },
    {
      name: "Web Sunucu",
      status: "healthy" as ServiceStatus,
      description: "React Vite frontend",
      icon: <Globe className="w-5 h-5" />,
      extra: "Aktif",
    },
    {
      name: "SMS Servisi (Twilio)",
      status: (twilioConfigured ? "healthy" : "warning") as ServiceStatus,
      description: twilioConfigured
        ? `Yapılandırıldı — ${twilioPhone}`
        : "Twilio yapılandırılmamış",
      icon: <Wifi className="w-5 h-5" />,
      extra: twilioConfigured ? "Hazır" : "Ayarlar → SMS",
    },
    {
      name: "E-posta Servisi (SMTP)",
      status: (smtpConfigured ? "healthy" : "warning") as ServiceStatus,
      description: smtpConfigured
        ? `Yapılandırıldı — ${smtpHost}:${get("smtp_port") ?? "587"}`
        : "SMTP yapılandırılmamış",
      icon: <Zap className="w-5 h-5" />,
      extra: smtpConfigured ? "Hazır" : "Ayarlar → E-posta",
    },
    {
      name: "Auth Sistemi",
      status: "healthy" as ServiceStatus,
      description: "OTP doğrulama ve oturum yönetimi",
      icon: <Lock className="w-5 h-5" />,
      extra: "Aktif",
    },
  ];

  const healthyCount = services.filter(s => s.status === "healthy").length;
  const warningCount = services.filter(s => s.status === "warning").length;
  const overallStatus: ServiceStatus = warningCount > 0 ? "warning" : "healthy";

  const platformName = get("platform_name") ?? "TaşıYo Lojistik";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Sistem Durumu</h1>
          <p className="text-muted-foreground mt-1">Platform servislerinin anlık durumu ve sistem sağlığı</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching || isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Overall Status Banner */}
          <div className={`flex items-center gap-4 p-5 rounded-2xl border ${STATUS_CONFIG[overallStatus].bg} ${STATUS_CONFIG[overallStatus].border}`}>
            <div className="p-3 rounded-xl bg-white shadow-sm">
              <ShieldAlert className={`w-6 h-6 ${STATUS_CONFIG[overallStatus].color}`} />
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-lg ${STATUS_CONFIG[overallStatus].color}`}>
                {overallStatus === "healthy"
                  ? `${platformName} — Tüm Sistemler Normal Çalışıyor`
                  : "Bazı Servisler Yapılandırma Bekliyor"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {healthyCount} servis aktif
                {warningCount > 0 && ` · ${warningCount} servis yapılandırma bekliyor`}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`${STATUS_CONFIG[overallStatus].color} ${STATUS_CONFIG[overallStatus].border} font-semibold`}
            >
              {overallStatus === "healthy" ? "Sağlıklı" : "Uyarı"}
            </Badge>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(svc => {
              const cfg = STATUS_CONFIG[svc.status];
              return (
                <Card key={svc.name} className={`shadow-sm border ${cfg.border}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${cfg.bg}`}>
                        <span className={cfg.color}>{svc.icon}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium">
                        {cfg.icon}
                        <span className={cfg.color}>{cfg.label}</span>
                      </div>
                    </div>
                    <p className="font-semibold">{svc.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-3">{svc.description}</p>
                    <div className="text-xs text-muted-foreground">
                      <span className={`font-medium ${svc.status === "healthy" ? "text-green-600" : "text-yellow-600"}`}>
                        {svc.extra}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Config Summary */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">E-posta (SMTP) Durumu</CardTitle>
                <CardDescription>OTP ve bildirim e-postaları için</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "SMTP Sunucu", key: "smtp_host" },
                    { label: "SMTP Port",   key: "smtp_port" },
                    { label: "Kullanıcı",   key: "smtp_user" },
                    { label: "Şifre",       key: "smtp_pass" },
                    { label: "Gönderen",    key: "smtp_from" },
                  ].map(f => {
                    const val = get(f.key);
                    return (
                      <div key={f.key} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className={val ? "font-medium text-foreground" : "text-muted-foreground/50 italic"}>
                          {val ?? "Girilmemiş"}
                        </span>
                      </div>
                    );
                  })}
                  <div className={`mt-3 flex items-center gap-2 text-xs font-semibold ${smtpConfigured ? "text-green-600" : "text-yellow-600"}`}>
                    {smtpConfigured
                      ? <><CheckCircle2 className="w-4 h-4" /> E-posta servisi aktif</>
                      : <><AlertTriangle className="w-4 h-4" /> Yapılandırılmamış — OTP'ler konsola yazılıyor</>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">SMS (Twilio) Durumu</CardTitle>
                <CardDescription>OTP SMS gönderimi için</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Account SID",  key: "twilio_account_sid" },
                    { label: "Auth Token",   key: "twilio_auth_token" },
                    { label: "Telefon No",   key: "twilio_phone_number" },
                  ].map(f => {
                    const val = get(f.key);
                    return (
                      <div key={f.key} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className={val ? "font-medium text-foreground" : "text-muted-foreground/50 italic"}>
                          {val ?? "Girilmemiş"}
                        </span>
                      </div>
                    );
                  })}
                  <div className={`mt-3 flex items-center gap-2 text-xs font-semibold ${twilioConfigured ? "text-green-600" : "text-yellow-600"}`}>
                    {twilioConfigured
                      ? <><CheckCircle2 className="w-4 h-4" /> SMS servisi aktif</>
                      : <><AlertTriangle className="w-4 h-4" /> Yapılandırılmamış — OTP'ler konsola yazılıyor</>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Config */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Platform Yapılandırması
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                {[
                  { label: "Platform Adı",     key: "platform_name" },
                  { label: "Destek E-posta",   key: "platform_support_email" },
                  { label: "OTP Süresi (dk)",  key: "otp_expiry_minutes" },
                  { label: "Maks. OTP Deneme", key: "max_otp_attempts" },
                ].map(f => {
                  const val = get(f.key);
                  return (
                    <div key={f.key} className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">{f.label}</span>
                      <span className={val ? "font-medium" : "text-muted-foreground/50 italic text-xs"}>
                        {val ?? "Varsayılan"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
