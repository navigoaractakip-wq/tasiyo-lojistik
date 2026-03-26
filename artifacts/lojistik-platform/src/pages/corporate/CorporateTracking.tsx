import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MapPin, Truck, Clock, CheckCircle2,
  Phone, AlertCircle, RefreshCw, Package, Loader2,
  PackageCheck, Navigation2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

type Shipment = {
  id: string;
  status: string;
  currentLat?: number;
  currentLng?: number;
  load?: {
    id: string;
    title: string;
    origin: string;
    destination: string;
    price?: number;
  };
  driver?: {
    id: string;
    name: string;
    phone?: string;
    rating?: number;
  };
  timeline: {
    id: string;
    event: string;
    description?: string;
    timestamp: string;
  }[];
  createdAt: string;
};

async function fetchMyShipments(token: string, status?: string): Promise<{ shipments: Shipment[] }> {
  const url = `/api/shipments${status ? `?status=${status}` : ""}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Veri alınamadı");
  return res.json();
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Truck }> = {
  pickup:     { label: "Yükleme Bekleniyor", color: "bg-yellow-100 text-yellow-700", icon: PackageCheck },
  in_transit: { label: "Yolda",             color: "bg-blue-100 text-blue-700",    icon: Truck },
  delivered:  { label: "Teslim Edildi",      color: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  cancelled:  { label: "İptal Edildi",       color: "bg-red-100 text-red-700",      icon: AlertCircle },
};

const EVENT_LABELS: Record<string, string> = {
  pickup:     "Yükleme Noktasında",
  in_transit: "Yola Çıkıldı",
  delivered:  "Teslim Edildi",
  cancelled:  "İptal Edildi",
};

export default function CorporateTracking() {
  const { toast } = useToast();
  const { token } = useAuth();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const [reportSending, setReportSending] = useState(false);

  const { data: activeData, isLoading: activeLoading, refetch: refetchActive } = useQuery({
    queryKey: ["corp-shipments-active", token],
    queryFn: () => fetchMyShipments(token!, "pickup,in_transit"),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  const { data: deliveredData, isLoading: deliveredLoading } = useQuery({
    queryKey: ["corp-shipments-delivered", token],
    queryFn: () => fetchMyShipments(token!, "delivered"),
    enabled: !!token,
  });

  const activeShipments = activeData?.shipments ?? [];
  const deliveredShipments = deliveredData?.shipments ?? [];
  const deliveredThisMonth = deliveredShipments.filter(s => {
    const d = new Date(s.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const selectedShipment: Shipment | undefined =
    activeShipments.find(s => s.id === selectedId) ?? activeShipments[0];

  const handleReport = async () => {
    if (!reportMsg.trim()) {
      toast({ title: "Mesaj Gerekli", description: "Lütfen sorunu açıklayın.", variant: "destructive" });
      return;
    }
    if (!selectedShipment) return;
    setReportSending(true);
    try {
      const loadTitle = selectedShipment.load?.title ?? "Bilinmeyen İlan";
      const driverName = selectedShipment.driver?.name ?? "Bilinmeyen Şoför";
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: `Sevkiyat Sorunu: ${loadTitle}`,
          category: "technical",
          priority: "high",
          message: `[Sevkiyat #${selectedShipment.id}] [Şoför: ${driverName}]\n\n${reportMsg}`,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Sorun Bildirildi", description: "Destek ekibimiz en kısa sürede yanıt verecek." });
      setReportOpen(false);
      setReportMsg("");
      qc.invalidateQueries({ queryKey: ["corp-support-tickets"] });
    } catch {
      toast({ title: "Gönderilemedi", description: "Lütfen tekrar deneyin.", variant: "destructive" });
    } finally {
      setReportSending(false);
    }
  };

  const StatusIcon = selectedShipment ? (STATUS_MAP[selectedShipment.status]?.icon ?? Truck) : Truck;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Canlı Takip</h1>
          <p className="text-muted-foreground mt-1">Aktif araçlarınızı ve seferlerinizi takip edin</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            refetchActive();
            qc.invalidateQueries({ queryKey: ["corp-shipments-delivered", token] });
          }}
        >
          <RefreshCw className="w-4 h-4" /> Yenile
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Aktif Sefer",       value: activeLoading ? "…" : String(activeShipments.length),  color: "text-blue-600",  bg: "bg-blue-50" },
          { label: "Tamamlanan (Bu Ay)",value: deliveredLoading ? "…" : String(deliveredThisMonth),    color: "text-green-600", bg: "bg-green-50" },
          { label: "Toplam Tamamlanan", value: deliveredLoading ? "…" : String(deliveredShipments.length), color: "text-gray-600", bg: "bg-gray-50" },
        ].map(s => (
          <Card key={s.label} className={`border-0 shadow-sm ${s.bg}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor…
        </div>
      ) : activeShipments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Truck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground">Aktif sefer bulunamadı</p>
            <p className="text-sm text-muted-foreground mt-1">
              Şu an yolda veya yükleme bekleyen sefer yok.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipment list */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Aktif Seferler</h2>
            {activeShipments.map(s => {
              const sm = STATUS_MAP[s.status] ?? STATUS_MAP.pickup;
              const Icon = sm.icon;
              return (
                <Card
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`cursor-pointer transition-all border-2 shadow-sm ${
                    (selectedShipment?.id ?? activeShipments[0]?.id) === s.id
                      ? "border-primary"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{s.load?.title ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{s.driver?.name ?? "—"}</p>
                      </div>
                      <Badge className={`text-xs border-0 ml-2 shrink-0 ${sm.color}`}>
                        <Icon className="w-3 h-3 mr-1" /> {sm.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 text-green-500" />
                      <span>{s.load?.origin ?? "—"}</span>
                      <span className="mx-1">→</span>
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>{s.load?.destination ?? "—"}</span>
                    </div>
                    {s.currentLat && s.currentLng && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                        <Navigation2 className="w-3 h-3" />
                        <span>{s.currentLat.toFixed(4)}, {s.currentLng.toFixed(4)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Detail panel */}
          {selectedShipment && (
            <div className="lg:col-span-2 space-y-4">
              {/* "Map" location card */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <div className="text-center">
                    <StatusIcon className="w-10 h-10 text-primary mx-auto mb-2" />
                    <p className="font-semibold text-primary">
                      {STATUS_MAP[selectedShipment.status]?.label ?? selectedShipment.status}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedShipment.load?.origin} → {selectedShipment.load?.destination}
                    </p>
                    {selectedShipment.currentLat && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Konum: {selectedShipment.currentLat.toFixed(4)}, {selectedShipment.currentLng?.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className={`border-0 gap-1 text-xs ${STATUS_MAP[selectedShipment.status]?.color ?? "bg-gray-100 text-gray-700"}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block opacity-70" />
                      {STATUS_MAP[selectedShipment.status]?.label ?? selectedShipment.status}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Shipment info */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{selectedShipment.load?.title ?? "—"}</CardTitle>
                    <Badge variant="outline" className="text-xs">#{selectedShipment.id}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Kalkış</p>
                        <p className="font-medium">{selectedShipment.load?.origin ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Varış</p>
                        <p className="font-medium">{selectedShipment.load?.destination ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Truck className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Şoför</p>
                        <p className="font-medium">{selectedShipment.driver?.name ?? "—"}</p>
                        {selectedShipment.driver?.phone && (
                          <p className="text-xs text-blue-600">{selectedShipment.driver.phone}</p>
                        )}
                      </div>
                    </div>
                    {selectedShipment.load?.price && (
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Ücret</p>
                          <p className="font-medium text-green-600">
                            {selectedShipment.load.price.toLocaleString("tr-TR")} ₺
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    {selectedShipment.driver?.phone ? (
                      <a
                        href={`tel:${selectedShipment.driver.phone.replace(/\s/g, "")}`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Phone className="w-4 h-4" />
                          {selectedShipment.driver.name ?? "Şoförü Ara"}
                        </Button>
                      </a>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1 gap-2" disabled>
                        <Phone className="w-4 h-4" /> Telefon Yok
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setReportOpen(true)}
                    >
                      <AlertCircle className="w-4 h-4" /> Sorun Bildir
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline from real events */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Sefer Zaman Çizelgesi</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {selectedShipment.timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Henüz etkinlik kaydedilmedi.</p>
                  ) : (
                    <div className="relative pl-6">
                      {selectedShipment.timeline.map((ev, i) => {
                        const isLast = i === selectedShipment.timeline.length - 1;
                        const label = EVENT_LABELS[ev.event] ?? ev.event;
                        const ts = new Date(ev.timestamp);
                        const timeStr = ts.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
                        return (
                          <div key={ev.id} className="relative pb-4 last:pb-0">
                            {i < selectedShipment.timeline.length - 1 && (
                              <div className="absolute left-[-15px] top-5 w-0.5 h-full bg-green-300" />
                            )}
                            <div className={`absolute left-[-20px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center
                              ${isLast ? "bg-blue-500 border-blue-500 animate-pulse" : "bg-green-500 border-green-500"}`}
                            >
                              {!isLast && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <div className="ml-2">
                              <p className={`text-sm font-medium ${isLast ? "text-blue-600" : "text-gray-900"}`}>
                                {label}
                              </p>
                              {ev.description && (
                                <p className="text-xs text-muted-foreground">{ev.description}</p>
                              )}
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{timeStr}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Delivered section */}
      {deliveredShipments.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Tamamlanan Seferler</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {deliveredShipments.map(s => (
              <Card key={s.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.load?.title ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{s.driver?.name ?? "—"} · {s.load?.origin} → {s.load?.destination}</p>
                  </div>
                  {s.load?.price && (
                    <p className="text-sm font-bold text-green-600 shrink-0">
                      {s.load.price.toLocaleString("tr-TR")} ₺
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={(v) => { if (!v) { setReportOpen(false); setReportMsg(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" /> Sorun Bildir
            </DialogTitle>
            <DialogDescription>
              {selectedShipment?.load?.title && (
                <span className="font-medium text-foreground">{selectedShipment.load.title}</span>
              )}{" "}
              sevkiyatıyla ilgili sorununuzu açıklayın. Destek ekibimiz size en kısa sürede ulaşacak.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedShipment?.driver && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground text-xs mb-1">Sevkiyat Bilgisi</p>
                <p className="font-medium">Şoför: {selectedShipment.driver.name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {selectedShipment.load?.origin} → {selectedShipment.load?.destination}
                </p>
              </div>
            )}
            <Textarea
              placeholder="Sorununuzu detaylı şekilde açıklayın…"
              rows={4}
              value={reportMsg}
              onChange={e => setReportMsg(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={reportSending} onClick={() => { setReportOpen(false); setReportMsg(""); }}>
              İptal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={reportSending || !reportMsg.trim()}
              onClick={handleReport}
            >
              {reportSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gönder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
