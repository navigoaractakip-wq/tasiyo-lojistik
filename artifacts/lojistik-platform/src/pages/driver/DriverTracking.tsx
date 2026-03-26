import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MapPin, Package, CheckCircle2, Truck, Navigation,
  Loader2, WifiOff, Radio,
  PackageCheck, History, AlertTriangle, Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

// ─── Step definitions ──────────────────────────────────────────────────────────

interface TripStep {
  event: string;
  label: string;
  icon: typeof Truck;
  status?: string;
  isWarning?: boolean;
  isInfo?: boolean;
}

interface WaypointDef {
  type: "pickup" | "delivery";
  name: string;
}

function buildSteps(load: any): TripStep[] {
  const steps: TripStep[] = [];

  // Adım 0 — otomatik bilgi adımı (şoför tıklayamaz)
  steps.push({
    event: "assigned",
    label: "Sefer Atandı – Yükleme Noktasına Gidiniz",
    icon: Navigation,
    isInfo: true,
  });

  // Ara durakları parse et
  const waypoints: WaypointDef[] = [];
  if (load?.waypoints) {
    try { waypoints.push(...JSON.parse(load.waypoints)); } catch { /* ignore */ }
  }

  const pickupWaypoints = waypoints.filter((w) => w.type === "pickup");
  const deliveryWaypoints = waypoints.filter((w) => w.type === "delivery");

  // İlk yükleme noktası (origin)
  steps.push({
    event: "pickup_0",
    label: `Yükleme: ${load?.origin ?? "Yükleme Noktası"}`,
    icon: PackageCheck,
    status: "pickup",
  });

  // Ek yükleme ara durakları
  pickupWaypoints.forEach((wp, i) => {
    steps.push({
      event: `pickup_${i + 1}`,
      label: `Yükleme ${i + 2}: ${wp.name}`,
      icon: PackageCheck,
    });
  });

  // Ara teslim noktaları
  deliveryWaypoints.forEach((wp, i) => {
    steps.push({
      event: `delivery_${i}`,
      label: `Ara Teslim ${i + 1}: ${wp.name}`,
      icon: MapPin,
      status: i === 0 ? "in_transit" : undefined,
    });
  });

  // Son teslim noktası (destination)
  steps.push({
    event: "delivered",
    label: `Teslim: ${load?.destination ?? "Teslim Noktası"}`,
    icon: CheckCircle2,
    status: "delivered",
    isWarning: true,
  });

  return steps;
}

// ─── Geo & Fetch helpers ────────────────────────────────────────────────────────

type GeoStatus = "idle" | "requesting" | "tracking" | "denied" | "error";

async function fetchShipments(token: string, status: string) {
  const r = await fetch(`/api/shipments?status=${encodeURIComponent(status)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return { shipments: [] };
  return r.json();
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function DriverTracking() {
  const { toast } = useToast();
  const { token } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pendingStep, setPendingStep] = useState<TripStep | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const locationSentRef = useRef<number>(0);

  // Aktif seferler: assigned + pickup + in_transit
  const { data: activeData } = useQuery({
    queryKey: ["shipments-active", token],
    queryFn: () => fetchShipments(token!, "assigned,pickup,in_transit"),
    enabled: !!token,
    refetchInterval: 30_000,
  });
  const activeShipment = (activeData?.shipments ?? [])[0] ?? null;

  const { data: deliveredData, isLoading: deliveredLoading } = useQuery({
    queryKey: ["shipments-delivered", token],
    queryFn: () => fetchShipments(token!, "delivered"),
    enabled: !!token,
  });
  const deliveredShipments = deliveredData?.shipments ?? [];
  const now = new Date();
  const thisMonthCount = deliveredShipments.filter((s: any) => {
    const d = new Date(s.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // ─── Dinamik adımlar ─────────────────────────────────────────────────────────
  const steps = useMemo(() => buildSteps(activeShipment?.load), [activeShipment?.load]);

  const completedEvents = useMemo(() => {
    return new Set<string>((activeShipment?.timeline ?? []).map((e: any) => e.event as string));
  }, [activeShipment?.timeline]);

  const currentStepIdx = useMemo(() => {
    const idx = steps.findIndex((s) => !completedEvents.has(s.event));
    return idx === -1 ? steps.length : idx; // hepsi tamamlandıysa
  }, [steps, completedEvents]);

  // ─── GPS ─────────────────────────────────────────────────────────────────────
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: "GPS Desteklenmiyor", description: "Bu cihaz konum servisini desteklemiyor.", variant: "destructive" });
      setGeoStatus("error");
      return;
    }
    setGeoStatus("requesting");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setAccuracy(Math.round(acc));
        setGeoStatus("tracking");
        const now2 = Date.now();
        if (activeShipment && now2 - locationSentRef.current > 30_000) {
          locationSentRef.current = now2;
          fetch(`/api/shipments/${activeShipment.id}/location`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          }).catch(() => {/* ignore */});
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus("denied");
          toast({ title: "Konum İzni Reddedildi", description: "Uygulama konum bilginize erişemedi.", variant: "destructive" });
        } else {
          setGeoStatus("error");
          toast({ title: "Konum Alınamadı", description: err.message, variant: "destructive" });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [activeShipment, token, toast]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGeoStatus("idle");
    setCoords(null);
  }, []);

  useEffect(() => () => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  // ─── Adım güncelle ───────────────────────────────────────────────────────────
  const handleStepUpdate = async (step: TripStep) => {
    if (!activeShipment) {
      toast({ title: "Aktif Sefer Yok", description: "Güncelleme yapacak aktif sefer bulunamadı.", variant: "destructive" });
      return;
    }
    setUpdatingStatus(true);
    try {
      const body: Record<string, any> = {
        event: step.event,
        description: step.label,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      };
      // Eğer adım ana durumu değiştiriyorsa ekle
      if (step.status) body.status = step.status;

      const res = await fetch(`/api/shipments/${activeShipment.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());

      toast({ title: "Durum Güncellendi", description: `${step.label} bilgisi kaydedildi.` });
      qc.invalidateQueries({ queryKey: ["shipments-active"] });
      if (step.status === "delivered") {
        qc.invalidateQueries({ queryKey: ["shipments-delivered"] });
      }
    } catch {
      toast({ title: "Güncelleme Başarısız", description: "Lütfen tekrar deneyin.", variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ─── Onay diyaloğu mesajları ─────────────────────────────────────────────────
  const getConfirmMessages = (step: TripStep) => {
    if (step.event === "delivered") {
      return {
        title: "Teslimatı tamamlamak istediğinizden emin misiniz?",
        description: "Yükü teslim ettiğinizi onaylıyor musunuz? Bu işlem geri alınamaz ve sefer tamamlanmış olarak kaydedilecektir.",
        confirmText: "Evet, Teslim Ettim",
      };
    }
    if (step.event.startsWith("pickup_")) {
      return {
        title: "Yükleme noktasında mısınız?",
        description: `"${step.label}" noktasında olduğunuzu onaylıyor musunuz?`,
        confirmText: "Evet, Buradayım",
      };
    }
    return {
      title: "Bu adımı onaylıyor musunuz?",
      description: `"${step.label}" adımını tamamlıyor musunuz?`,
      confirmText: "Evet, Onayla",
    };
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-bold text-white mb-1">Takip Merkezi</h1>
        <p className="text-blue-200 text-sm">Konum paylaşımı ve sefer yönetimi</p>
        <div className="flex gap-2 mt-4">
          {(["active", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab ? "bg-white text-primary shadow-sm" : "text-white/70 hover:text-white"
              }`}
            >
              {tab === "active" ? "Aktif Sefer" : "Geçmiş"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {activeTab === "active" && (
          <>
            {/* GPS Tracking Card */}
            <Card className="shadow-md border-0 overflow-hidden">
              <div className={`px-5 py-4 transition-colors ${geoStatus === "tracking" ? "bg-gradient-to-r from-green-600 to-emerald-600" : "bg-gradient-to-r from-blue-600 to-blue-700"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider">GPS Konum Takibi</p>
                    <p className="text-white font-bold text-base mt-0.5">
                      {geoStatus === "tracking" ? "Canlı Yayın Aktif" : geoStatus === "requesting" ? "Konum Alınıyor…" : "Bağlantı Yok"}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${geoStatus === "tracking" ? "bg-white/20" : "bg-white/10"}`}>
                    {geoStatus === "tracking"
                      ? <Radio className="w-5 h-5 text-white animate-pulse" />
                      : geoStatus === "requesting"
                      ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                      : <WifiOff className="w-5 h-5 text-white/60" />}
                  </div>
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                {coords ? (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Navigation className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-700">Anlık Konumunuz</span>
                      {accuracy != null && (
                        <Badge variant="outline" className="ml-auto text-xs">±{accuracy}m</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground mb-0.5">Enlem</p>
                        <p className="font-mono text-sm font-semibold">{coords.lat.toFixed(6)}°</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground mb-0.5">Boylam</p>
                        <p className="font-mono text-sm font-semibold">{coords.lng.toFixed(6)}°</p>
                      </div>
                    </div>
                    {activeShipment && (
                      <p className="text-xs text-green-600 text-center">Konumunuz otomatik olarak gönderiye iletilmektedir</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-muted-foreground">
                    {geoStatus === "denied"
                      ? "Konum izni reddedildi. Tarayıcı ayarlarından izin verin."
                      : geoStatus === "error"
                      ? "GPS alınamadı. Bağlantınızı kontrol edin."
                      : "Konumunuzu paylaşmak için aşağıdaki butona basın."}
                  </div>
                )}
                {geoStatus === "tracking" ? (
                  <Button onClick={stopTracking} variant="outline" className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50">
                    <Radio className="w-4 h-4" /> Takibi Durdur
                  </Button>
                ) : (
                  <Button
                    onClick={startTracking}
                    className="w-full gap-2"
                    disabled={geoStatus === "requesting" || geoStatus === "denied"}
                  >
                    {geoStatus === "requesting"
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Konum Alınıyor…</>
                      : <><Navigation className="w-4 h-4" /> GPS Takibini Başlat</>}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Active Shipment — Dynamic Steps */}
            {activeShipment ? (
              <Card className="shadow-sm border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" /> Sefer Durumu
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* Rota özeti */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <MapPin className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-600">{(activeShipment as any).load?.origin ?? "—"}</span>
                    {(() => {
                      const wps: WaypointDef[] = [];
                      try { wps.push(...JSON.parse((activeShipment as any).load?.waypoints ?? "[]")); } catch { /* ignore */ }
                      return wps.map((wp, i) => (
                        <span key={i} className="flex items-center gap-1 text-sm text-gray-500">
                          <span className="text-gray-300">→</span>
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          {wp.name}
                        </span>
                      ));
                    })()}
                    <span className="text-gray-300">→</span>
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-sm text-gray-600">{(activeShipment as any).load?.destination ?? "—"}</span>
                  </div>

                  {/* Adımlar */}
                  <div className="grid gap-2">
                    {steps.map((step, idx) => {
                      const isDone = completedEvents.has(step.event);
                      const isCurrent = idx === currentStepIdx;
                      const isNext = !isDone && !isCurrent;

                      if (step.isInfo) {
                        return (
                          <div
                            key={step.event}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${
                              isDone
                                ? "bg-green-50 border-green-100 text-green-700"
                                : "bg-blue-50 border-blue-100 text-blue-700"
                            }`}
                          >
                            {isDone
                              ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                              : <Info className="w-5 h-5 text-blue-500 shrink-0 animate-pulse" />}
                            <span className="text-sm font-medium">{step.label}</span>
                            {isDone && <Badge className="ml-auto text-xs bg-green-100 text-green-700 border-0">Tamamlandı</Badge>}
                            {!isDone && <Badge className="ml-auto text-xs bg-blue-100 text-blue-700 border-0">Aktif</Badge>}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={step.event}
                          disabled={isDone || !isCurrent || updatingStatus}
                          onClick={() => setPendingStep(step)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            isDone
                              ? "bg-green-50 border-green-100 text-green-700 opacity-70 cursor-default"
                              : isCurrent && step.isWarning
                              ? "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 cursor-pointer"
                              : isCurrent
                              ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer"
                              : "bg-white border-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                          }`}
                        >
                          {isDone
                            ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            : isCurrent && step.isWarning
                            ? <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                            : isCurrent
                            ? <step.icon className="w-5 h-5 text-blue-600 shrink-0 animate-pulse" />
                            : <step.icon className="w-5 h-5 text-gray-300 shrink-0" />}

                          <span className="text-sm font-medium">{step.label}</span>

                          {isDone && <Badge className="ml-auto text-xs bg-green-100 text-green-700 border-0">Tamamlandı</Badge>}
                          {isCurrent && !step.isWarning && (
                            <span className="ml-auto text-xs text-blue-600 font-medium">Buradayım →</span>
                          )}
                          {isCurrent && step.isWarning && (
                            <span className="ml-auto text-xs text-orange-600 font-medium">Onayla ⚠</span>
                          )}
                          {isNext && (
                            <span className="ml-auto text-xs text-gray-300">Bekliyor</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm border-0">
                <CardContent className="p-5 text-center text-sm text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  <p className="font-medium text-gray-500 mb-1">Aktif Sefer Yok</p>
                  <p className="text-xs">Kabul edilen bir teklifiniz olmadığı için durum güncellemesi gösterilmiyor.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === "history" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {deliveredLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-3 text-center">
                      <Skeleton className="h-7 w-10 mx-auto" />
                      <Skeleton className="h-3 w-16 mx-auto mt-1" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                [
                  { label: "Toplam Sefer", value: String(deliveredShipments.length) },
                  { label: "Bu Ay", value: String(thisMonthCount) },
                  { label: "Tamamlandı", value: deliveredShipments.length > 0 ? "✓" : "—" },
                ].map((s) => (
                  <Card key={s.label} className="border-0 shadow-sm">
                    <CardContent className="p-3 text-center">
                      <p className="text-xl font-bold text-primary">{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {deliveredLoading && Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="shadow-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {!deliveredLoading && deliveredShipments.length === 0 && (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-medium text-gray-500">Henüz tamamlanan sefer yok</p>
                <p className="text-xs text-muted-foreground mt-1">Teslim ettiğiniz seferler burada görünür</p>
              </div>
            )}

            {!deliveredLoading && deliveredShipments.map((s: any) => {
              const loadLabel = s.load
                ? (s.load.origin && s.load.destination
                    ? `${s.load.origin} → ${s.load.destination}`
                    : s.load.title)
                : "Yük bilgisi yok";
              const dateLabel = new Date(s.createdAt).toLocaleDateString("tr-TR", {
                day: "2-digit", month: "long", year: "numeric",
              });
              return (
                <Card key={s.id} className="shadow-sm border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">{loadLabel}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">#{s.id} · {dateLabel}</p>
                        </div>
                      </div>
                      {s.load?.price && (
                        <p className="text-sm font-bold text-green-600 shrink-0 ml-2">
                          {s.load.price.toLocaleString("tr-TR")} ₺
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {pendingStep && (() => {
        const conf = getConfirmMessages(pendingStep);
        return (
          <Dialog open={!!pendingStep} onOpenChange={(open) => { if (!open) setPendingStep(null); }}>
            <DialogContent className="sm:max-w-sm mx-4">
              <DialogHeader>
                <DialogTitle className={`flex items-center gap-2 ${pendingStep.isWarning ? "text-orange-600" : ""}`}>
                  {pendingStep.isWarning && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                  {conf.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 pt-1">
                  {conf.description}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={updatingStatus}
                  onClick={() => setPendingStep(null)}
                >
                  İptal
                </Button>
                <Button
                  className={`flex-1 ${pendingStep.isWarning ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                  disabled={updatingStatus}
                  onClick={async () => {
                    await handleStepUpdate(pendingStep);
                    setPendingStep(null);
                  }}
                >
                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : conf.confirmText}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
