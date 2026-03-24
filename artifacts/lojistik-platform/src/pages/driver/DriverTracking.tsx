import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Package, Clock, CheckCircle2, Truck, Navigation,
  Phone, Star, Loader2, WifiOff, Radio,
  PackageCheck, AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useListShipments } from "@workspace/api-client-react";

const COMPLETED_SHIPMENTS = [
  { id: "SHP-2030", load: "Bursa - İzmir Konteyner", date: "22 Mart 2026", price: 22000, rating: 5 },
  { id: "SHP-2025", load: "Kocaeli - Antalya Genel Kargo", date: "19 Mart 2026", price: 18500, rating: 4 },
  { id: "SHP-2018", load: "Ankara - İstanbul Parsiyel", date: "15 Mart 2026", price: 14000, rating: 5 },
  { id: "SHP-2011", load: "İzmir - Bursa Otomotiv", date: "10 Mart 2026", price: 28000, rating: 5 },
];

const STATUS_STEPS: { status: string; label: string; icon: typeof Truck }[] = [
  { status: "pickup", label: "Yükleme Noktasındayım", icon: PackageCheck },
  { status: "in_transit", label: "Yola Çıktım", icon: Truck },
  { status: "delivered", label: "Teslim Ettim", icon: CheckCircle2 },
];

type GeoStatus = "idle" | "requesting" | "tracking" | "denied" | "error";

export default function DriverTracking() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [activeShipmentStatus, setActiveShipmentStatus] = useState<string>("pickup");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const locationSentRef = useRef<number>(0);

  const { data: shipmentsData } = useListShipments({ status: "in_transit" });
  const activeShipment = shipmentsData?.shipments?.[0] ?? null;

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

        // Throttle: send to API at most every 30 seconds if there's an active shipment
        const now = Date.now();
        if (activeShipment && now - locationSentRef.current > 30_000) {
          locationSentRef.current = now;
          fetch(`/api/shipments/${activeShipment.id}/location`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
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
  }, [activeShipment, toast]);

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

  const handleStatusUpdate = async (status: string, label: string) => {
    if (!activeShipment) {
      toast({ title: "Aktif Sefer Yok", description: "Durum güncellemesi yapacak aktif sefer bulunamadı.", variant: "destructive" });
      return;
    }
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/shipments/${activeShipment.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, description: label, ...(coords ? { lat: coords.lat, lng: coords.lng } : {}) }),
      });
      if (!res.ok) throw new Error(await res.text());
      setActiveShipmentStatus(status);
      toast({ title: "Durum Güncellendi", description: `${label} bilgisi kaydedildi.` });
    } catch {
      toast({ title: "Güncelleme Başarısız", description: "Lütfen tekrar deneyin.", variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-bold text-white mb-1">Takip Merkezi</h1>
        <p className="text-blue-200 text-sm">Konum paylaşımı ve sefer yönetimi</p>
        <div className="flex gap-2 mt-4">
          {(["active", "history"] as const).map(tab => (
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
                {/* Coordinates display */}
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

                {/* GPS toggle button */}
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

            {/* Active Shipment Status */}
            {activeShipment ? (
              <Card className="shadow-sm border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" /> Sefer Durumu
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">{(activeShipment as any).load?.origin ?? "—"}</span>
                    <span className="text-gray-300 mx-1">→</span>
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-600">{(activeShipment as any).load?.destination ?? "—"}</span>
                  </div>
                  <div className="grid gap-2">
                    {STATUS_STEPS.map(({ status, label, icon: Icon }) => {
                      const isCurrent = activeShipmentStatus === status;
                      const isDone = STATUS_STEPS.findIndex(s => s.status === activeShipmentStatus) >
                                    STATUS_STEPS.findIndex(s => s.status === status);
                      return (
                        <button
                          key={status}
                          disabled={isDone || isCurrent || updatingStatus}
                          onClick={() => handleStatusUpdate(status, label)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            isCurrent
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : isDone
                              ? "bg-green-50 border-green-100 text-green-700 opacity-60"
                              : "bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 text-gray-700"
                          }`}
                        >
                          {isDone
                            ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            : isCurrent
                            ? <Icon className="w-5 h-5 text-blue-600 shrink-0 animate-pulse" />
                            : <Icon className="w-5 h-5 shrink-0" />}
                          <span className="text-sm font-medium">{label}</span>
                          {isCurrent && <Badge className="ml-auto text-xs bg-blue-100 text-blue-700 border-0">Aktif</Badge>}
                          {isDone && <Badge className="ml-auto text-xs bg-green-100 text-green-700 border-0">Tamamlandı</Badge>}
                          {!isCurrent && !isDone && (
                            <span className="ml-auto text-xs text-muted-foreground">Güncelle →</span>
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
              {[
                { label: "Toplam Sefer", value: "127" },
                { label: "Bu Ay", value: "12" },
                { label: "Ort. Puan", value: "4.9 ⭐" },
              ].map(s => (
                <Card key={s.label} className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-primary">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {COMPLETED_SHIPMENTS.map(s => (
              <Card key={s.id} className="shadow-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{s.load}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.id} · {s.date}</p>
                        <div className="flex mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < s.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-green-600">{s.price.toLocaleString("tr-TR")} ₺</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
