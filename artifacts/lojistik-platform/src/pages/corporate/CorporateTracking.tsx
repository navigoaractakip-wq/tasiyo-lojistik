import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Truck, Navigation, Clock, CheckCircle2,
  Phone, AlertCircle, Package, RefreshCw,
} from "lucide-react";

const ACTIVE_SHIPMENTS = [
  {
    id: "SHP-2034",
    load: "İstanbul - Ankara Tekstil",
    origin: "İstanbul, Tuzla",
    destination: "Ankara, Ostim",
    driver: "Mehmet Yılmaz",
    driverPhone: "+90 533 222 33 44",
    plate: "34 ABC 1234",
    progressPct: 62,
    currentLocation: "Bolu, D-100 Karayolu",
    eta: "~3 saat",
    status: "in_transit",
    weight: 12,
    price: 18500,
  },
  {
    id: "SHP-2031",
    load: "İzmir - Bursa Konteyner",
    origin: "İzmir, Liman",
    destination: "Bursa, Gemlik OSB",
    driver: "Hasan Çelik",
    driverPhone: "+90 535 444 55 66",
    plate: "35 GHI 9012",
    progressPct: 18,
    currentLocation: "İzmir, Menemen",
    eta: "~5 saat 30 dk",
    status: "in_transit",
    weight: 24,
    price: 21000,
  },
];

const TIMELINE = [
  { label: "Yük Teslim Alındı",   time: "08:30", done: true,  location: "İstanbul, Tuzla" },
  { label: "Yola Çıkıldı",        time: "09:15", done: true,  location: "TEM Otoyolu" },
  { label: "Güzergah Kontrolü",   time: "11:00", done: true,  location: "Düzce Dinlenme Tesisi" },
  { label: "Aktif Yolculuk",      time: "Şimdi", done: false, location: "Bolu, D-100", current: true },
  { label: "Varışa Yakın",        time: "~16:30",done: false, location: "Ankara Çevreyolu" },
  { label: "Teslim Edildi",       time: "—",     done: false, location: "Ankara, Ostim" },
];

const statusColor = {
  in_transit: "bg-blue-100 text-blue-700",
  waiting: "bg-yellow-100 text-yellow-700",
  delivered: "bg-green-100 text-green-700",
};

export default function CorporateTracking() {
  const [selectedId, setSelectedId] = useState(ACTIVE_SHIPMENTS[0].id);
  const selected = ACTIVE_SHIPMENTS.find(s => s.id === selectedId) ?? ACTIVE_SHIPMENTS[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Canlı Takip</h1>
          <p className="text-muted-foreground mt-1">Aktif araçlarınızı ve seferlerinizi takip edin</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Yenile
        </Button>
      </div>

      {/* Active count */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Yoldaki Araç",    value: ACTIVE_SHIPMENTS.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Tamamlanan (Bu Ay)", value: "14",                 color: "text-green-600", bg: "bg-green-50" },
          { label: "Gecikme Riski",   value: "0",                     color: "text-gray-500", bg: "bg-gray-50" },
        ].map(s => (
          <Card key={s.label} className={`border-0 shadow-sm ${s.bg}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Shipment list */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Aktif Seferler</h2>
          {ACTIVE_SHIPMENTS.map(s => (
            <Card
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`cursor-pointer transition-all border-2 shadow-sm ${
                selectedId === s.id ? "border-primary" : "border-transparent hover:border-border"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{s.id}</p>
                    <p className="text-xs text-muted-foreground">{s.load}</p>
                  </div>
                  <Badge className={`text-xs border-0 ${statusColor.in_transit}`}>
                    <Truck className="w-3 h-3 mr-1" /> Yolda
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <Navigation className="w-3 h-3 text-blue-500" />
                  <span>{s.currentLocation}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${s.progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                  <span>{s.progressPct}% tamamlandı</span>
                  <span>ETA: {s.eta}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Detail */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map placeholder */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="relative h-56 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-10 h-10 text-primary mx-auto mb-2 animate-bounce" />
                <p className="font-semibold text-primary">{selected.currentLocation}</p>
                <p className="text-sm text-muted-foreground">{selected.driver} · {selected.plate}</p>
              </div>
              <div className="absolute top-3 right-3">
                <Badge className="bg-green-500 text-white border-0 gap-1 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                  Canlı
                </Badge>
              </div>
            </div>
          </Card>

          {/* Shipment Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{selected.load}</CardTitle>
                <Badge variant="outline" className="text-xs">{selected.id}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Kalkış</p>
                    <p className="font-medium">{selected.origin}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Varış</p>
                    <p className="font-medium">{selected.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tahmini Varış</p>
                    <p className="font-medium">{selected.eta}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Yük</p>
                    <p className="font-medium">{selected.weight} ton</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Phone className="w-4 h-4" /> {selected.driver}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50">
                  <AlertCircle className="w-4 h-4" /> Sorun Bildir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sefer Zaman Çizelgesi</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative pl-6">
                {TIMELINE.map((step, i) => (
                  <div key={i} className="relative pb-4 last:pb-0">
                    {i < TIMELINE.length - 1 && (
                      <div className={`absolute left-[-15px] top-5 w-0.5 h-full ${step.done ? "bg-green-400" : "bg-gray-200"}`} />
                    )}
                    <div className={`absolute left-[-20px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${step.done ? "bg-green-500 border-green-500" : (step as any).current ? "bg-blue-500 border-blue-500 animate-pulse" : "bg-white border-gray-300"}`}
                    >
                      {step.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="ml-2">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${(step as any).current ? "text-blue-600" : step.done ? "text-gray-900" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                        {(step as any).current && <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-0">Şimdi</Badge>}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{step.time}</span>
                        {step.location && <><span>·</span><MapPin className="w-3 h-3" /><span>{step.location}</span></>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
