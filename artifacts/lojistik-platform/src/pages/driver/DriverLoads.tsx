import { useState } from "react";
import { useListLoads } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Search, MapPin, Weight, Truck, Clock, ChevronRight,
  SlidersHorizontal, Zap, Package, Star, CheckCircle2,
} from "lucide-react";

const MOCK_LOADS = [
  {
    id:"1", title:"İstanbul - Ankara Parsiyel Yük",    origin:"İstanbul, Tuzla",      destination:"Ankara, Ostim",
    weight:4.5,  loadType:"Parsiyel",    vehicleType:"TIR",          pricingModel:"fixed",   price:15000, status:"active", isPremium:true,
    distance:450, duration:"5-6 saat",  urgency:"normal", postedAgo:"30 dk",
  },
  {
    id:"2", title:"İzmir - Bursa Konteyner",           origin:"İzmir, Aliağa Liman",  destination:"Bursa, Gemlik",
    weight:24,   loadType:"Konteyner",   vehicleType:"Açık Kasa",    pricingModel:"bidding",  price:null,  status:"active", isPremium:false,
    distance:290, duration:"3-4 saat",  urgency:"urgent", postedAgo:"2 saat",
  },
  {
    id:"3", title:"Kocaeli - Antalya Tekstil",         origin:"Kocaeli, Gebze OSB",   destination:"Antalya, DOSAB",
    weight:12,   loadType:"Genel Kargo", vehicleType:"Kapalı Kasa",  pricingModel:"fixed",   price:18500, status:"active", isPremium:true,
    distance:680, duration:"7-8 saat",  urgency:"normal", postedAgo:"1 saat",
  },
  {
    id:"4", title:"Gaziantep - Mersin Tekstil İhracat", origin:"Gaziantep Organize",  destination:"Mersin Liman",
    weight:20,   loadType:"Dökme",       vehicleType:"Tenteli TIR",  pricingModel:"bidding",  price:null,  status:"active", isPremium:false,
    distance:220, duration:"2.5 saat",  urgency:"urgent", postedAgo:"45 dk",
  },
  {
    id:"5", title:"Adana - Konya Soğuk Zincir",        origin:"Adana, Yüreğir",       destination:"Konya Merkez",
    weight:6,    loadType:"Soğuk Zincir",vehicleType:"Frigorifik",   pricingModel:"fixed",   price:12000, status:"active", isPremium:false,
    distance:310, duration:"3.5 saat",  urgency:"normal", postedAgo:"3 saat",
  },
  {
    id:"6", title:"Bursa - İstanbul Otomotiv Parça",   origin:"Bursa, Nilüfer OSB",   destination:"İstanbul, Tuzla",
    weight:8,    loadType:"Ağır Yük",    vehicleType:"Lowbed",       pricingModel:"fixed",   price:28000, status:"active", isPremium:true,
    distance:160, duration:"2 saat",    urgency:"normal", postedAgo:"5 dk",
  },
  {
    id:"7", title:"Samsun - İzmir Tahıl",              origin:"Samsun Liman",          destination:"İzmir Alsancak",
    weight:40,   loadType:"Dökme",       vehicleType:"TIR",          pricingModel:"fixed",   price:18000, status:"active", isPremium:true,
    distance:840, duration:"9 saat",    urgency:"normal", postedAgo:"2 saat",
  },
  {
    id:"8", title:"Eskişehir - Kayseri Makine",        origin:"Eskişehir OSB",         destination:"Kayseri OSB",
    weight:15,   loadType:"Proje Kargo", vehicleType:"Lowbed",       pricingModel:"bidding",  price:null,  status:"active", isPremium:false,
    distance:380, duration:"4 saat",    urgency:"normal", postedAgo:"6 saat",
  },
];

type Load = typeof MOCK_LOADS[0];

const VEHICLE_TYPES = ["Tümü", "TIR", "Kapalı Kasa", "Açık Kasa", "Frigorifik", "Lowbed", "Tenteli TIR"];

function OfferDialog({ load, onClose }: { load: Load; onClose: () => void }) {
  const { toast } = useToast();
  const [price, setPrice] = useState(load.price ? String(load.price) : "");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      toast({ title: "Hata", description: "Geçerli bir fiyat giriniz.", variant: "destructive" });
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <DialogContent className="max-w-sm">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Teklifiniz Alındı!</h3>
          <p className="text-sm text-gray-500 mb-4">
            <strong>{Number(price).toLocaleString("tr-TR")} ₺</strong> teklifiniz iletildi.<br />
            Firma en kısa sürede sizinle iletişime geçecek.
          </p>
          <Button className="w-full" onClick={onClose}>Kapat</Button>
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Teklif Ver</DialogTitle>
        <DialogDescription className="text-xs leading-relaxed">
          {load.title}
        </DialogDescription>
      </DialogHeader>

      <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm mb-1">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-3.5 h-3.5 text-green-500 shrink-0" />
          <span>{load.origin}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span>{load.destination}</span>
        </div>
        <div className="flex gap-4 text-xs text-gray-500 pt-1 border-t border-gray-100">
          <span>{load.weight} ton</span>
          <span>{load.vehicleType}</span>
          <span>{load.distance} km</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label className="text-sm font-medium">
            Teklif Fiyatı (₺) <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1">
            <Input
              type="number"
              min={1}
              placeholder={load.price ? String(load.price) : "Fiyatınızı girin"}
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="pr-8"
              autoFocus
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">₺</span>
          </div>
          {load.price && (
            <p className="text-xs text-muted-foreground mt-1">
              İlan fiyatı: <span className="font-semibold text-green-600">{load.price.toLocaleString("tr-TR")} ₺</span>
            </p>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium">Not (opsiyonel)</Label>
          <Textarea
            placeholder="Taşıma şartları, araç bilgisi vb..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="mt-1 resize-none h-20 text-sm"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Vazgeç
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Gönderiliyor..." : "Teklif Gönder"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export default function DriverLoads() {
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("Tümü");
  const [showFilters, setShowFilters] = useState(false);
  const [offerLoad, setOfferLoad] = useState<Load | null>(null);
  const { data } = useListLoads({ status: "active" });

  const allLoads = (data?.loads?.length ? data.loads : MOCK_LOADS) as typeof MOCK_LOADS;
  const filtered = allLoads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.title.toLowerCase().includes(q) || l.origin.toLowerCase().includes(q) || l.destination.toLowerCase().includes(q);
    const matchVehicle = vehicleFilter === "Tümü" || l.vehicleType === vehicleFilter;
    return matchSearch && matchVehicle;
  });

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-bold text-white mb-1">Yük İlanları</h1>
        <p className="text-blue-200 text-sm mb-4">{filtered.length} uygun ilan bulundu</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9 h-11 rounded-xl border-0 bg-white/95 text-gray-900"
              placeholder="Rota, şehir veya yük türü..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={`h-11 w-11 rounded-xl border-0 ${showFilters ? "bg-white text-primary" : "bg-white/20 text-white border-white/30"}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Araç Tipi</p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {VEHICLE_TYPES.map(v => (
              <button
                key={v}
                onClick={() => setVehicleFilter(v)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  vehicleFilter === v ? "bg-primary text-white" : "bg-white text-gray-700 border border-gray-200"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loads List */}
      <div className="px-4 mt-3 space-y-3">
        {filtered.map(load => (
          <Card key={load.id} className="shadow-sm border-0 overflow-hidden">
            <CardContent className="p-0">
              {load.isPremium && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 flex items-center gap-1">
                  <Star className="w-3 h-3 text-white fill-white" />
                  <span className="text-[11px] text-white font-semibold">Premium İlan</span>
                </div>
              )}
              {(load as any).urgency === "urgent" && !load.isPremium && (
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-3 py-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-white" />
                  <span className="text-[11px] text-white font-semibold">Acil İlan</span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-sm leading-tight pr-2">{load.title}</h3>
                  <Badge variant="outline" className="text-xs shrink-0">{load.loadType}</Badge>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <div className="w-px h-4 bg-gray-200" />
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  </div>
                  <div className="text-xs space-y-1 flex-1">
                    <p className="text-gray-700">{load.origin}</p>
                    <p className="text-gray-700">{load.destination}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1"><Weight className="w-3.5 h-3.5" />{load.weight} ton</div>
                  <div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />{load.vehicleType}</div>
                  <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{load.distance} km</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {load.pricingModel === "bidding" ? (
                      <span className="text-blue-600 font-semibold text-sm">Açık Teklif</span>
                    ) : (
                      <span className="text-green-600 font-bold text-base">{load.price?.toLocaleString("tr-TR")} ₺</span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />{(load as any).postedAgo}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 px-4 rounded-xl gap-1"
                    onClick={() => setOfferLoad(load)}
                  >
                    Teklif Ver <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="font-medium text-muted-foreground">Sonuç bulunamadı</p>
            <p className="text-sm text-muted-foreground mt-1">Farklı bir arama deneyin</p>
          </div>
        )}
      </div>

      {/* Offer Dialog */}
      <Dialog open={!!offerLoad} onOpenChange={open => !open && setOfferLoad(null)}>
        {offerLoad && <OfferDialog load={offerLoad} onClose={() => setOfferLoad(null)} />}
      </Dialog>
    </div>
  );
}
