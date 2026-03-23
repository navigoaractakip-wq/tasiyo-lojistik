import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ShieldAlert, Server, Database, Wifi, CheckCircle2, AlertTriangle,
  XCircle, RefreshCw, HardDrive, Cpu, MemoryStick, Globe,
  Lock, Activity, Clock, Users, Zap,
} from "lucide-react";

type ServiceStatus = "healthy" | "warning" | "error";

interface Service {
  name: string;
  status: ServiceStatus;
  uptime: string;
  latency: string;
  description: string;
  icon: React.ReactNode;
}

const SERVICES: Service[] = [
  { name: "API Sunucu",      status: "healthy", uptime: "99.98%", latency: "14ms",  description: "Express REST API servisi", icon: <Server className="w-5 h-5" /> },
  { name: "Veritabanı",      status: "healthy", uptime: "100%",   latency: "5ms",   description: "PostgreSQL veritabanı", icon: <Database className="w-5 h-5" /> },
  { name: "Web Sunucu",      status: "healthy", uptime: "99.95%", latency: "28ms",  description: "React Vite frontend", icon: <Globe className="w-5 h-5" /> },
  { name: "SMS Servisi",     status: "warning", uptime: "—",      latency: "—",     description: "Twilio yapılandırılmamış", icon: <Wifi className="w-5 h-5" /> },
  { name: "E-posta Servisi", status: "warning", uptime: "—",      latency: "—",     description: "SMTP yapılandırılmamış", icon: <Zap className="w-5 h-5" /> },
  { name: "Auth Sistemi",    status: "healthy", uptime: "99.9%",  latency: "22ms",  description: "OTP doğrulama ve oturum", icon: <Lock className="w-5 h-5" /> },
];

const STATUS_CONFIG = {
  healthy: { label:"Çalışıyor", color:"text-green-600",  bg:"bg-green-50",  border:"border-green-200", icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> },
  warning: { label:"Uyarı",     color:"text-yellow-600", bg:"bg-yellow-50", border:"border-yellow-200",icon: <AlertTriangle className="w-4 h-4 text-yellow-600" /> },
  error:   { label:"Hata",      color:"text-red-600",    bg:"bg-red-50",    border:"border-red-200",   icon: <XCircle className="w-4 h-4 text-red-600" /> },
};

const RECENT_LOGS = [
  { time: "23:34:41", level:"WARN",  msg: "SMTP yapılandırılmamış — OTP konsola yazıldı" },
  { time: "23:34:41", level:"INFO",  msg: "📧 OTP kodu ahmet@logistikco.com adresine konsola yazıldı" },
  { time: "23:34:35", level:"INFO",  msg: "GET /api/users → 200 (2ms)" },
  { time: "23:32:09", level:"INFO",  msg: "API Sunucu 8080 portunda başlatıldı" },
  { time: "23:32:08", level:"INFO",  msg: "PostgreSQL bağlantısı kuruldu" },
  { time: "23:31:50", level:"INFO",  msg: "DB schema senkronize edildi (otp_codes, user_sessions, platform_settings)" },
  { time: "23:30:00", level:"INFO",  msg: "Codegen tamamlandı: 14 yeni endpoint" },
];

const LOG_COLORS: Record<string, string> = {
  INFO:  "text-blue-400",
  WARN:  "text-yellow-400",
  ERROR: "text-red-400",
  DEBUG: "text-gray-400",
};

export default function AdminSystem() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const healthyCount = SERVICES.filter(s => s.status === "healthy").length;
  const warningCount = SERVICES.filter(s => s.status === "warning").length;
  const overallStatus: ServiceStatus = warningCount > 0 ? "warning" : "healthy";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Sistem Durumu</h1>
          <p className="text-muted-foreground mt-1">Platform servislerinin anlık durumu ve sistem sağlığı</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* Overall Status Banner */}
      <div className={`flex items-center gap-4 p-5 rounded-2xl border ${STATUS_CONFIG[overallStatus].bg} ${STATUS_CONFIG[overallStatus].border}`}>
        <div className={`p-3 rounded-xl bg-white shadow-sm`}>
          <ShieldAlert className={`w-6 h-6 ${STATUS_CONFIG[overallStatus].color}`} />
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-lg ${STATUS_CONFIG[overallStatus].color}`}>
            {overallStatus === "healthy" ? "Tüm Sistemler Normal Çalışıyor" : "Bazı Servisler Dikkat Gerektiriyor"}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {healthyCount} servis aktif · {warningCount} servis yapılandırma bekliyor
          </p>
        </div>
        <Badge variant="outline" className={`${STATUS_CONFIG[overallStatus].color} ${STATUS_CONFIG[overallStatus].border} font-semibold`}>
          {overallStatus === "healthy" ? "Sağlıklı" : "Uyarı"}
        </Badge>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map(svc => {
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
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div><span className="text-foreground font-medium">{svc.uptime}</span> Uptime</div>
                  <div><span className="text-foreground font-medium">{svc.latency}</span> Gecikme</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Resources */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Sistem Kaynakları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { label: "CPU Kullanımı",    value: 23, unit: "%", icon: <Cpu className="w-4 h-4" />, color: "bg-blue-500" },
            { label: "RAM Kullanımı",    value: 58, unit: "%", icon: <MemoryStick className="w-4 h-4" />, color: "bg-purple-500" },
            { label: "Disk Kullanımı",   value: 41, unit: "%", icon: <HardDrive className="w-4 h-4" />, color: "bg-orange-500" },
            { label: "Ağ Kullanımı",     value: 12, unit: "%", icon: <Activity className="w-4 h-4" />, color: "bg-green-500" },
          ].map(r => (
            <div key={r.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-muted-foreground">{r.icon}</span>
                  {r.label}
                </div>
                <span className="text-sm font-semibold">{r.value}{r.unit}</span>
              </div>
              <Progress value={r.value} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Aktif Oturum",     value: "23",     icon: <Users className="w-4 h-4" />,    color: "text-blue-600 bg-blue-50" },
          { label: "Günlük İstek",     value: "12.4K",  icon: <Activity className="w-4 h-4" />, color: "text-green-600 bg-green-50" },
          { label: "Ortalama Yanıt",   value: "18ms",   icon: <Zap className="w-4 h-4" />,      color: "text-purple-600 bg-purple-50" },
          { label: "Son Yedekleme",    value: "2s önce",icon: <Clock className="w-4 h-4" />,    color: "text-orange-600 bg-orange-50" },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color.split(" ")[1]}`}>
                <span className={s.color.split(" ")[0]}>{s.icon}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Logs */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Sistem Logları</CardTitle>
          <CardDescription>Son sistem aktiviteleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs space-y-1.5 overflow-x-auto">
            {RECENT_LOGS.map((log, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-gray-500 shrink-0">{log.time}</span>
                <span className={`shrink-0 font-bold ${LOG_COLORS[log.level] ?? "text-gray-400"}`}>[{log.level}]</span>
                <span className="text-gray-300">{log.msg}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
