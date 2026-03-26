import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPlaceholder } from "@/components/ui/MapPlaceholder";
import {
  Navigation, Target, Zap, ZapOff, MapPin, ChevronRight,
  Loader2, AlertCircle, Truck, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

type NearbyLoad = {
  id: string;
  title: string;
  origin: string;
  destination: string;
  vehicleType: string;
  loadType: string;
  pricingModel: string;
  price?: number;
  weight?: number;
  distanceKm: number;
};

type RadarState = "off" | "locating" | "scanning" | "error";
type GeoPos = { lat: number; lng: number; accuracy: number };

const RADIUS_OPTIONS = [10, 25, 50, 100];
const POLL_INTERVAL_MS = 30_000;

async function fetchNearby(lat: number, lng: number, radius: number): Promise<NearbyLoad[]> {
  const url = `/api/loads/nearby?lat=${lat}&lng=${lng}&radius=${radius}&status=active`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Sunucu hatası");
  const data = await res.json();
  return data.loads as NearbyLoad[];
}

export default function DriverMap() {
  const [radarState, setRadarState] = useState<RadarState>("off");
  const [position, setPosition] = useState<GeoPos | null>(null);
  const [radius, setRadius] = useState(25);
  const [loads, setLoads] = useState<NearbyLoad[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestPosRef = useRef<GeoPos | null>(null);

  const doScan = useCallback(async (pos: GeoPos, r: number, silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const results = await fetchNearby(pos.lat, pos.lng, r);
      setLoads(results);
      setLastUpdate(new Date());
      setRadarState("scanning");
      setErrorMsg(null);
    } catch {
      setErrorMsg("Yükler getirilemedi. İnternet bağlantınızı kontrol edin.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const startRadar = useCallback(() => {
    setRadarState("locating");
    setErrorMsg(null);
    setLoads([]);

    if (!navigator.geolocation) {
      setRadarState("error");
      setErrorMsg("Bu cihaz konum özelliğini desteklemiyor.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const geoPos: GeoPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setPosition(geoPos);
        latestPosRef.current = geoPos;

        // First position → do immediate scan
        if (radarState !== "scanning") {
          doScan(geoPos, radius);
        }
      },
      (err) => {
        setRadarState("error");
        if (err.code === 1) setErrorMsg("Konum izni reddedildi. Tarayıcı ayarlarınızdan izin verin.");
        else if (err.code === 2) setErrorMsg("Konum alınamadı. GPS sinyalini kontrol edin.");
        else setErrorMsg("Konum zaman aşımı. Tekrar deneyin.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    // Poll every 30 seconds
    pollTimerRef.current = setInterval(() => {
      if (latestPosRef.current) {
        doScan(latestPosRef.current, radius, true);
      }
    }, POLL_INTERVAL_MS);
  }, [doScan, radius, radarState]);

  const stopRadar = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setRadarState("off");
    setLoads([]);
    setPosition(null);
    latestPosRef.current = null;
  }, []);

  // When radius changes during scanning, re-scan immediately
  useEffect(() => {
    if (radarState === "scanning" && latestPosRef.current) {
      doScan(latestPosRef.current, radius);
    }
  }, [radius]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);
    };
  }, []);

  const cityName = position
    ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
    : "Konum bekleniyor…";

  const accuracyLabel = position
    ? position.accuracy < 50 ? "Yüksek hassasiyet" : position.accuracy < 200 ? "Orta hassasiyet" : "Düşük hassasiyet"
    : null;

  return (
    <div className="relative flex flex-col h-[calc(100vh-56px)]">
      {/* Map area */}
      <div className="flex-1 relative min-h-0">
        <MapPlaceholder
          className="absolute inset-0 rounded-none border-0"
          origin={position ? "Konumunuz" : "Harita"}
          destination="Çevre"
        />

        {/* Location info chip */}
        <div className="absolute top-4 left-4 right-4">
          <Card className="bg-white/90 backdrop-blur-md border-0 shadow-lg rounded-2xl">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`p-2 rounded-full ${radarState === "scanning" ? "bg-green-100 text-green-600" : radarState === "locating" ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"}`}>
                <Navigation className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  {radarState === "scanning" ? "Konum Alındı" : radarState === "locating" ? "Konum Aranıyor" : "Mevcut Konum"}
                </p>
                <p className="text-sm font-bold truncate">{cityName}</p>
              </div>
              {accuracyLabel && (
                <Badge variant="outline" className="text-[10px] shrink-0 border-green-300 text-green-700">
                  {accuracyLabel}
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Radar animation */}
        <AnimatePresence>
          {(radarState === "scanning" || radarState === "locating") && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border-2 border-accent/50"
                  style={{ width: 120, height: 120, top: -60, left: -60 }}
                  animate={{ scale: [1, 3], opacity: [0.7, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 1 }}
                />
              ))}
              <div className="w-5 h-5 rounded-full bg-accent shadow-lg shadow-accent/50 border-2 border-white" />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Sheet */}
      <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.12)] overflow-y-auto max-h-[55%]">
        <div className="sticky top-0 bg-white z-10 px-6 pt-4 pb-3 border-b border-gray-50">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-lg font-bold font-display">
                {radarState === "off" && "Radar Kapalı"}
                {radarState === "locating" && "Konum Alınıyor…"}
                {radarState === "scanning" && "Çevrenizde İş Aranıyor"}
                {radarState === "error" && "Konum Hatası"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {radarState === "off" && "Yakın yükleri bulmak için radarı başlatın."}
                {radarState === "locating" && "GPS konumunuz alınıyor, lütfen bekleyin…"}
                {radarState === "scanning" && `Radar açık, konumunuza uygun yükler taranıyor.`}
                {radarState === "error" && (errorMsg ?? "Bilinmeyen hata.")}
              </p>
            </div>
            {radarState === "scanning" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                disabled={isRefreshing}
                onClick={() => latestPosRef.current && doScan(latestPosRef.current, radius)}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 space-y-4">
          {/* Error state */}
          {radarState === "error" && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          )}

          {/* Stats row */}
          {radarState === "scanning" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="text-2xl font-bold text-primary">{isRefreshing ? "…" : loads.length}</p>
                <p className="text-[11px] text-gray-500 font-medium">Yakın İlan</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="text-2xl font-bold text-accent">{radius} km</p>
                <p className="text-[11px] text-gray-500 font-medium">Yarıçap</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="text-2xl font-bold text-green-600">
                  {lastUpdate ? `${Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s` : "—"}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">Önce</p>
              </div>
            </div>
          )}

          {/* Radius selector */}
          {(radarState === "scanning" || radarState === "off" || radarState === "error") && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Tarama Yarıçapı
              </p>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      radius === r
                        ? "bg-primary text-white border-primary shadow-md"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/40"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nearby loads list */}
          {radarState === "scanning" && loads.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Yakın İlanlar
              </p>
              {loads.map((load) => (
                <Link key={load.id} href={`/dashboard/feeds`}>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{load.title}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                        <span className="truncate">{load.origin}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-accent">{load.distanceKm} km</p>
                      {load.price ? (
                        <p className="text-xs font-semibold text-green-600">{load.price.toLocaleString("tr-TR")} ₺</p>
                      ) : (
                        <p className="text-xs text-blue-500 font-medium">Açık Teklif</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {radarState === "scanning" && loads.length === 0 && !isRefreshing && (
            <div className="text-center py-4">
              <Target className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {radius} km çevrenizde aktif ilan bulunamadı.
              </p>
              <p className="text-xs text-muted-foreground mt-1">Yarıçapı artırmayı deneyin.</p>
            </div>
          )}

          {radarState === "locating" && (
            <div className="flex flex-col items-center py-4 gap-3">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
              <p className="text-sm text-muted-foreground">GPS sinyali bekleniyor…</p>
            </div>
          )}

          {/* Main action button */}
          {radarState === "off" || radarState === "error" ? (
            <Button
              className="w-full h-14 rounded-xl text-base font-bold bg-gradient-to-r from-accent to-orange-500 hover:from-orange-500 hover:to-accent shadow-xl shadow-accent/30"
              onClick={startRadar}
            >
              <Zap className="mr-2 h-5 w-5" />
              Radarı Başlat
            </Button>
          ) : radarState === "scanning" ? (
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl text-base font-bold border-red-200 text-red-600 hover:bg-red-50"
              onClick={stopRadar}
            >
              <ZapOff className="mr-2 h-5 w-5" />
              Radarı Durdur
            </Button>
          ) : null}

          {lastUpdate && radarState === "scanning" && (
            <p className="text-center text-xs text-muted-foreground">
              Son güncelleme: {lastUpdate.toLocaleTimeString("tr-TR")} · Her 30 sn otomatik yenilenir
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
