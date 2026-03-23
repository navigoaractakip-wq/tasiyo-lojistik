import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Package, Clock, CheckCircle2, Truck, Navigation,
  Phone, MessageSquare, AlertCircle, ChevronRight, Star,
} from "lucide-react";

const ACTIVE_SHIPMENTS = [
  {
    id: "SHP-2034",
    load: "İstanbul - Ankara Tekstil",
    origin: "İstanbul, Tuzla",
    destination: "Ankara, Ostim",
    status: "in_transit",
    progressPct: 62,
    currentLocation: "Bolu, D-100 Karayolu",
    eta: "~3 saat",
    weight: 12,
    price: 18500,
    company: "Borusan Lojistik",
    companyPhone: "+90 212 444 0 211",
  },
];

const COMPLETED_SHIPMENTS = [
  { id:"SHP-2030", load:"Bursa - İzmir Konteyner",      date:"22 Mart 2026", price: 22000, rating: 5 },
  { id:"SHP-2025", load:"Kocaeli - Antalya Genel Kargo",date:"19 Mart 2026", price: 18500, rating: 4 },
  { id:"SHP-2018", load:"Ankara - İstanbul Parsiyel",   date:"15 Mart 2026", price: 14000, rating: 5 },
  { id:"SHP-2011", load:"İzmir - Bursa Otomotiv",       date:"10 Mart 2026", price: 28000, rating: 5 },
];

const TIMELINE_STEPS = [
  { label: "Yük Teslim Alındı",     time: "08:30", done: true,   location: "İstanbul, Tuzla" },
  { label: "Yola Çıkıldı",          time: "09:15", done: true,   location: "TEM Otoyolu" },
  { label: "Güzergah Kontrolü",      time: "11:00", done: true,   location: "Düzce Dinlenme Tesisi" },
  { label: "Aktif Yolculuk",         time: "Şimdi", done: false,  location: "Bolu, D-100", current: true },
  { label: "Varış Noktasına Yakın", time: "~16:30", done: false,  location: "Ankara Çevreyolu" },
  { label: "Teslim Edildi",          time: "—",     done: false,  location: "Ankara, Ostim" },
];

export default function DriverTracking() {
  const [activeTab, setActiveTab] = useState<"active"|"history">("active");
  const shipment = ACTIVE_SHIPMENTS[0];

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-bold text-white mb-1">Takip Merkezi</h1>
        <p className="text-blue-200 text-sm">Aktif ve geçmiş seferleriniz</p>
        <div className="flex gap-2 mt-4">
          {(["active","history"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white text-primary shadow-sm"
                  : "text-white/70 hover:text-white"
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
            {/* Active Shipment Card */}
            <Card className="shadow-md border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-xs font-medium">AKTİF SEFER</p>
                    <p className="text-white font-bold text-base mt-0.5">{shipment.id}</p>
                  </div>
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur">
                    <Truck className="w-3 h-3 mr-1" /> Yolda
                  </Badge>
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                {/* Route */}
                <div>
                  <p className="font-semibold text-base">{shipment.load}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="w-0.5 h-8 bg-gray-200" />
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <p className="text-sm text-gray-700">{shipment.origin}</p>
                      <p className="text-sm text-gray-700">{shipment.destination}</p>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Tamamlanma Durumu</span>
                    <span className="font-semibold">{shipment.progressPct}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                      style={{ width: `${shipment.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Location & ETA */}
                <div className="flex gap-3">
                  <div className="flex-1 bg-blue-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-1"><Navigation className="w-3.5 h-3.5" />Şu An</div>
                    <p className="text-sm font-semibold">{shipment.currentLocation}</p>
                  </div>
                  <div className="flex-1 bg-orange-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs text-orange-600 mb-1"><Clock className="w-3.5 h-3.5" />Tahmini Varış</div>
                    <p className="text-sm font-semibold">{shipment.eta}</p>
                  </div>
                </div>

                {/* Info row */}
                <div className="flex justify-between text-sm border-t pt-3">
                  <span className="text-muted-foreground">{shipment.weight} ton</span>
                  <span className="font-semibold text-green-600">{shipment.price.toLocaleString("tr-TR")} ₺</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Phone className="w-4 h-4" /> Göndericiyi Ara
                  </Button>
                  <Button size="sm" className="flex-1 gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Sorun Bildir
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sefer Zaman Çizelgesi</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative pl-6">
                  {TIMELINE_STEPS.map((step, i) => (
                    <div key={i} className="relative pb-5 last:pb-0">
                      {/* Vertical line */}
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className={`absolute left-[-15px] top-5 w-0.5 h-full ${step.done ? "bg-green-400" : "bg-gray-200"}`} />
                      )}
                      {/* Dot */}
                      <div className={`absolute left-[-20px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center
                        ${step.done ? "bg-green-500 border-green-500" : step.current ? "bg-blue-500 border-blue-500 animate-pulse" : "bg-white border-gray-300"}`}>
                        {step.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="ml-2">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${step.current ? "text-blue-600" : step.done ? "text-gray-900" : "text-gray-400"}`}>
                            {step.label}
                          </p>
                          {step.current && <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-0">Şimdi</Badge>}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{step.time}</span>
                          {step.location && <>
                            <span className="text-muted-foreground">·</span>
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{step.location}</span>
                          </>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "history" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Toplam Sefer", value: "127" },
                { label: "Bu Ay",        value: "12" },
                { label: "Ortalama Puan",value: "4.9 ⭐" },
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
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{s.price.toLocaleString("tr-TR")} ₺</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 mt-1">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
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
