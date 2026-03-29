import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Package, Truck, CheckCircle2, XCircle, MapPin, Clock,
  Phone, ChevronRight, Loader2, Archive, Star,
  PackageCheck, AlertCircle, Navigation2, CalendarDays,
  TrendingUp, BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type Load = {
  id: string;
  title: string;
  origin: string;
  destination: string;
  loadType?: string;
  vehicleType?: string;
  weight?: number;
  price?: number;
  currency?: string;
  status: string;
  tier?: string;
  createdAt: string;
};

type Shipment = {
  id: string;
  status: string;
  loadId: string;
  driver?: {
    id: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
    rating?: number;
    vehicleType?: string;
    plateNumber?: string;
  };
  timeline: {
    id: string;
    event: string;
    description?: string;
    timestamp: string;
  }[];
  createdAt: string;
};

type Offer = {
  id: string;
  loadId: string;
  status: string;
  amount?: number;
  driver?: {
    id: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
    rating?: number;
  };
};

const LOAD_STATUS: Record<string, { label: string; color: string; icon: typeof CheckCircle2; bg: string }> = {
  active:    { label: "Aktif",           color: "text-blue-700",   bg: "bg-blue-50",   icon: Package },
  pending:   { label: "Beklemede",       color: "text-yellow-700", bg: "bg-yellow-50", icon: Clock },
  assigned:  { label: "Şoför Atandı",   color: "text-purple-700", bg: "bg-purple-50", icon: Truck },
  completed: { label: "Teslim Edildi",  color: "text-green-700",  bg: "bg-green-50",  icon: CheckCircle2 },
  cancelled: { label: "İptal Edildi",   color: "text-red-700",    bg: "bg-red-50",    icon: XCircle },
};

const SHIPMENT_STATUS: Record<string, { label: string; color: string; icon: typeof Truck }> = {
  assigned:   { label: "Şoför Atandı",       color: "bg-purple-100 text-purple-700", icon: Truck },
  pickup:     { label: "Yükleme Noktasında", color: "bg-yellow-100 text-yellow-700", icon: PackageCheck },
  in_transit: { label: "Yolda",              color: "bg-blue-100 text-blue-700",     icon: Navigation2 },
  delivered:  { label: "Teslim Edildi",      color: "bg-green-100 text-green-700",   icon: CheckCircle2 },
  cancelled:  { label: "İptal Edildi",       color: "bg-red-100 text-red-700",       icon: XCircle },
};

const EVENT_LABELS: Record<string, string> = {
  assigned:   "Şoför Atandı",
  pickup:     "Yükleme Noktasına Ulaşıldı",
  in_transit: "Taşıma Başladı",
  delivered:  "Teslim Edildi",
  cancelled:  "İptal Edildi",
  custom:     "Güncelleme",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function CorporateLoadHistory() {
  const { token } = useAuth();
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: loadsData, isLoading: loadsLoading } = useQuery({
    queryKey: ["loads", "mine-all"],
    queryFn: async () => {
      const res = await fetch("/api/loads?mine=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Yüklenemedi");
      return res.json() as Promise<{ loads: Load[]; total: number }>;
    },
    enabled: !!token,
  });

  const { data: shipmentsData } = useQuery({
    queryKey: ["shipments", "corporate"],
    queryFn: async () => {
      const res = await fetch("/api/shipments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Yüklenemedi");
      return res.json() as Promise<{ shipments: Shipment[] }>;
    },
    enabled: !!token,
  });

  const { data: offersData } = useQuery({
    queryKey: ["offers", "mine-accepted"],
    queryFn: async () => {
      const res = await fetch("/api/offers?mine=true&status=accepted", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Yüklenemedi");
      return res.json() as Promise<{ offers: Offer[] }>;
    },
    enabled: !!token,
  });

  const allLoads = loadsData?.loads ?? [];
  const pastLoads = allLoads.filter(l => l.status !== "active" && l.status !== "pending");

  const filtered = filterStatus === "all"
    ? pastLoads
    : pastLoads.filter(l => l.status === filterStatus);

  const shipmentByLoadId = (shipmentsData?.shipments ?? []).reduce<Record<string, Shipment>>(
    (acc, s) => { acc[String(s.loadId)] = s; return acc; },
    {}
  );
  const offerByLoadId = (offersData?.offers ?? []).reduce<Record<string, Offer>>(
    (acc, o) => { acc[String(o.loadId)] = o; return acc; },
    {}
  );

  const completedCount = pastLoads.filter(l => l.status === "completed").length;
  const cancelledCount = pastLoads.filter(l => l.status === "cancelled").length;
  const assignedCount  = pastLoads.filter(l => l.status === "assigned").length;
  const totalSpend = (offersData?.offers ?? []).reduce((sum, o) => sum + (o.amount ?? 0), 0);

  const selectedShipment = selectedLoad ? shipmentByLoadId[selectedLoad.id] : null;
  const selectedOffer    = selectedLoad ? offerByLoadId[selectedLoad.id] : null;
  const selectedDriver   = selectedShipment?.driver ?? selectedOffer?.driver ?? null;

  const filterButtons = [
    { key: "all",       label: "Tümü",          count: pastLoads.length },
    { key: "completed", label: "Teslim Edildi",  count: completedCount },
    { key: "assigned",  label: "Atandı",         count: assignedCount },
    { key: "cancelled", label: "İptal",          count: cancelledCount },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Archive className="w-6 h-6 text-primary" />
            Geçmiş İlanlar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tamamlanan, iptal edilen ve şoföre atanan ilanlarınızı buradan görüntüleyebilirsiniz.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{completedCount}</p>
              <p className="text-xs text-green-600/80 font-medium">Teslim Edildi</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{assignedCount}</p>
              <p className="text-xs text-purple-600/80 font-medium">Atandı</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{cancelledCount}</p>
              <p className="text-xs text-red-600/80 font-medium">İptal Edildi</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {totalSpend > 0 ? `₺${(totalSpend / 1000).toFixed(0)}K` : "₺0"}
              </p>
              <p className="text-xs text-blue-600/80 font-medium">Toplam Harcama</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterButtons.map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filterStatus === f.key
                ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                : "bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {f.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              filterStatus === f.key ? "bg-white/20" : "bg-muted"
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Load List */}
      {loadsLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="py-16 text-center text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-base mb-1">Geçmiş ilan bulunamadı</p>
            <p className="text-sm">
              {filterStatus === "all"
                ? "Henüz tamamlanan veya iptal edilen ilanınız yok."
                : `Bu kategoride geçmiş ilan bulunmuyor.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(load => {
            const st = LOAD_STATUS[load.status] ?? LOAD_STATUS.completed;
            const Icon = st.icon;
            const shipment = shipmentByLoadId[load.id];
            const offer = offerByLoadId[load.id];
            const driver = shipment?.driver ?? offer?.driver ?? null;
            return (
              <Card
                key={load.id}
                className="border border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedLoad(load)}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {/* Status icon */}
                    <div className={`w-11 h-11 rounded-xl ${st.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-5 h-5 ${st.color}`} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-foreground truncate">{load.title}</h3>
                        <Badge className={`text-xs font-medium border-0 ${st.bg} ${st.color}`}>
                          {st.label}
                        </Badge>
                        {load.tier && load.tier !== "genel" && (
                          <Badge variant="outline" className={`text-xs border-0 ${
                            load.tier === "premium" ? "bg-amber-50 text-amber-700" : "bg-purple-50 text-purple-700"
                          }`}>
                            {load.tier === "premium" ? "Premium" : "Profesyonel"}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{load.origin}</span>
                        <span className="mx-1">→</span>
                        <span className="truncate">{load.destination}</span>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                        {load.loadType && <span>{load.loadType}</span>}
                        {load.weight && <span>{load.weight} ton</span>}
                        {load.price && (
                          <span className="font-medium text-primary">
                            ₺{load.price.toLocaleString("tr-TR")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatDate(load.createdAt)}
                        </span>
                      </div>

                      {/* Driver chip */}
                      {driver && (
                        <div className="mt-2 flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={driver.avatarUrl ?? ""} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {driver.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground font-medium">{driver.name}</span>
                          {driver.rating && (
                            <span className="text-xs flex items-center gap-0.5 text-amber-500">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {driver.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-3" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedLoad} onOpenChange={open => !open && setSelectedLoad(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedLoad && (() => {
            const st = LOAD_STATUS[selectedLoad.status] ?? LOAD_STATUS.completed;
            const Icon = st.icon;
            const shipSt = selectedShipment ? (SHIPMENT_STATUS[selectedShipment.status] ?? null) : null;
            const ShipIcon = shipSt?.icon ?? Truck;

            return (
              <>
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-lg font-bold font-display flex items-center gap-2">
                    <Archive className="w-5 h-5 text-primary" />
                    İlan Detayı
                  </SheetTitle>
                </SheetHeader>

                {/* Status Hero */}
                <div className={`rounded-2xl ${st.bg} p-5 mb-5 flex items-center gap-4`}>
                  <div className={`w-14 h-14 rounded-xl bg-white/70 flex items-center justify-center shrink-0`}>
                    <Icon className={`w-7 h-7 ${st.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Durum</p>
                    <p className={`text-xl font-bold ${st.color}`}>{st.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Oluşturulma: {formatDate(selectedLoad.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Shipment real-time status */}
                {selectedShipment && shipSt && (
                  <div className={`rounded-2xl ${shipSt.color} p-4 mb-5 flex items-center gap-3`}>
                    <ShipIcon className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Taşıma Durumu: {shipSt.label}</p>
                      <p className="text-xs opacity-80">Sevkiyat ID: #{selectedShipment.id}</p>
                    </div>
                  </div>
                )}

                {/* Load Info */}
                <div className="space-y-3 mb-5">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    İlan Bilgileri
                  </h3>
                  <Card className="border-border/60">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">İlan Başlığı</p>
                        <p className="font-semibold text-foreground">{selectedLoad.title}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Yükleme
                          </p>
                          <p className="text-sm font-medium">{selectedLoad.origin}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Teslimat
                          </p>
                          <p className="text-sm font-medium">{selectedLoad.destination}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-1 border-t border-border/40">
                        {selectedLoad.loadType && (
                          <div>
                            <p className="text-xs text-muted-foreground">Yük Tipi</p>
                            <p className="text-sm font-medium">{selectedLoad.loadType}</p>
                          </div>
                        )}
                        {selectedLoad.weight && (
                          <div>
                            <p className="text-xs text-muted-foreground">Ağırlık</p>
                            <p className="text-sm font-medium">{selectedLoad.weight} ton</p>
                          </div>
                        )}
                        {selectedLoad.price && (
                          <div>
                            <p className="text-xs text-muted-foreground">Ücret</p>
                            <p className="text-sm font-bold text-primary">
                              ₺{selectedLoad.price.toLocaleString("tr-TR")}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Driver Info */}
                {selectedDriver && (
                  <div className="space-y-3 mb-5">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Şoför Bilgileri
                    </h3>
                    <Card className="border-border/60">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-12 w-12 border-2 border-primary/20">
                            <AvatarImage src={selectedDriver.avatarUrl ?? ""} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {selectedDriver.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">{selectedDriver.name}</p>
                            {selectedDriver.rating && (
                              <div className="flex items-center gap-1 text-amber-500">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span className="text-sm font-medium">{selectedDriver.rating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">/ 5.0</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedDriver.phone && (
                          <a
                            href={`tel:${selectedDriver.phone}`}
                            className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                          >
                            <Phone className="w-4 h-4" />
                            {selectedDriver.phone}
                          </a>
                        )}
                        {(selectedDriver as any).vehicleType && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" />
                            {(selectedDriver as any).vehicleType}
                            {(selectedDriver as any).plateNumber && ` — ${(selectedDriver as any).plateNumber}`}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Delivery Timeline */}
                {selectedShipment && selectedShipment.timeline && selectedShipment.timeline.length > 0 && (
                  <div className="space-y-3 mb-5">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Teslimat Zaman Çizelgesi
                    </h3>
                    <Card className="border-border/60">
                      <CardContent className="p-4">
                        <div className="relative">
                          {[...selectedShipment.timeline].reverse().map((ev, i, arr) => {
                            const isLast = i === arr.length - 1;
                            const isDelivered = ev.event === "delivered";
                            const isCancelled = ev.event === "cancelled";
                            return (
                              <div key={ev.id} className="flex gap-3 pb-4 last:pb-0">
                                <div className="flex flex-col items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                                    isDelivered
                                      ? "bg-green-500 border-green-500 text-white"
                                      : isCancelled
                                        ? "bg-red-500 border-red-500 text-white"
                                        : i === 0
                                          ? "bg-primary border-primary text-white"
                                          : "bg-muted border-border text-muted-foreground"
                                  }`}>
                                    {isDelivered
                                      ? <CheckCircle2 className="w-4 h-4" />
                                      : isCancelled
                                        ? <XCircle className="w-4 h-4" />
                                        : <Clock className="w-3.5 h-3.5" />
                                    }
                                  </div>
                                  {!isLast && (
                                    <div className="w-0.5 flex-1 bg-border mt-1 min-h-[12px]" />
                                  )}
                                </div>
                                <div className="flex-1 pt-0.5 pb-2">
                                  <p className={`text-sm font-semibold ${
                                    isDelivered ? "text-green-700" : isCancelled ? "text-red-700" : "text-foreground"
                                  }`}>
                                    {EVENT_LABELS[ev.event] ?? ev.event}
                                  </p>
                                  {ev.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground/70 mt-1">
                                    {formatDateTime(ev.timestamp)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Cancelled Info */}
                {selectedLoad.status === "cancelled" && !selectedShipment && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">İlan İptal Edildi</p>
                      <p className="text-xs text-red-600/80 mt-0.5">
                        Bu ilan iptal edilmiştir. Taşıma başlatılmadığı için sevkiyat kaydı bulunmamaktadır.
                      </p>
                    </div>
                  </div>
                )}

                {/* No shipment info */}
                {(selectedLoad.status === "assigned" || selectedLoad.status === "completed") && !selectedShipment && (
                  <div className="rounded-2xl bg-muted/60 p-4 flex gap-3 items-center">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                    <p className="text-sm text-muted-foreground">Sevkiyat bilgileri yükleniyor…</p>
                  </div>
                )}

                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedLoad(null)}
                  >
                    Kapat
                  </Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
