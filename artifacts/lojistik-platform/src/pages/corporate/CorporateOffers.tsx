import { useState } from "react";
import { useListOffers, useAcceptOffer, useRejectOffer } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare, Search, CheckCircle2, XCircle, Clock,
  Star, Phone, Truck, Package, MapPin, ChevronRight, TrendingDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MOCK_OFFERS = [
  {
    id:"1", loadId:"1", loadTitle:"İstanbul - Ankara Parsiyel Yük",
    driverName:"Mehmet Yılmaz", driverRating:4.9, driverShipments:127, driverPhone:"+90 533 222 33 44",
    amount:13500, note:"Araç müsait, aynı gün yola çıkabilirim.", status:"pending",
    vehicleType:"TIR", vehiclePlate:"34 ABC 1234", createdAt:"2 saat önce",
  },
  {
    id:"2", loadId:"1", loadTitle:"İstanbul - Ankara Parsiyel Yük",
    driverName:"Ali Demir",     driverRating:4.8, driverShipments:89,  driverPhone:"+90 534 333 44 55",
    amount:14000, note:"Deneyimli sürücü, sigortalı araç.", status:"pending",
    vehicleType:"Kapalı Kasa", vehiclePlate:"06 DEF 5678", createdAt:"3 saat önce",
  },
  {
    id:"3", loadId:"2", loadTitle:"İzmir - Bursa Konteyner",
    driverName:"Hasan Çelik",  driverRating:4.7, driverShipments:210, driverPhone:"+90 535 444 55 66",
    amount:21000, note:"Konteyner taşımacılığında 5 yıl deneyim.", status:"accepted",
    vehicleType:"Açık Kasa", vehiclePlate:"35 GHI 9012", createdAt:"1 gün önce",
  },
  {
    id:"4", loadId:"3", loadTitle:"Kocaeli - Antalya Tekstil",
    driverName:"Fatih Kaya",   driverRating:4.9, driverShipments:315, driverPhone:"+90 536 555 66 77",
    amount:17500, note:"Tekstil yükü deneyimim mevcut, itinalı taşıma garantisi.", status:"pending",
    vehicleType:"Tenteli TIR", vehiclePlate:"41 JKL 3456", createdAt:"5 saat önce",
  },
  {
    id:"5", loadId:"3", loadTitle:"Kocaeli - Antalya Tekstil",
    driverName:"İbrahim Şahin",driverRating:4.6, driverShipments:78,  driverPhone:"+90 537 666 77 88",
    amount:18000, note:"GPS takipli araç, günlük konum bildirimi.", status:"rejected",
    vehicleType:"Kapalı Kasa", vehiclePlate:"41 MNO 7890", createdAt:"6 saat önce",
  },
];

const STATUS_MAP = {
  pending:  { label: "Bekliyor",   variant: "secondary"  as const, icon: <Clock className="w-3 h-3" /> },
  accepted: { label: "Kabul Edildi", variant: "default"  as const, icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: "Reddedildi", variant: "destructive"as const, icon: <XCircle className="w-3 h-3" /> },
};

export default function CorporateOffers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [accepting, setAccepting] = useState<string|null>(null);
  const { toast } = useToast();
  const { data } = useListOffers({});
  const { mutate: acceptOffer } = useAcceptOffer({ mutation: {
    onSuccess: () => toast({ title: "Teklif Kabul Edildi", description: "Şoför bilgilendirildi." })
  }});
  const { mutate: rejectOffer } = useRejectOffer({ mutation: {
    onSuccess: () => toast({ title: "Teklif Reddedildi" })
  }});

  const offers = (data?.offers?.length ? data.offers : MOCK_OFFERS) as typeof MOCK_OFFERS;
  const filtered = offers.filter(o => {
    const matchSearch = !search || o.loadTitle.toLowerCase().includes(search.toLowerCase()) || o.driverName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || o.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = { all: offers.length, pending: offers.filter(o=>o.status==="pending").length, accepted: offers.filter(o=>o.status==="accepted").length, rejected: offers.filter(o=>o.status==="rejected").length };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">Teklifler</h1>
        <p className="text-muted-foreground mt-1">İlanlarınıza gelen şoför teklifleri</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam Teklif", value: counts.all,      bg: "bg-gray-50",   text: "text-gray-800" },
          { label: "Bekleyen",      value: counts.pending,   bg: "bg-yellow-50", text: "text-yellow-700" },
          { label: "Kabul Edilen",  value: counts.accepted,  bg: "bg-green-50",  text: "text-green-700" },
          { label: "Reddedilen",    value: counts.rejected,  bg: "bg-red-50",    text: "text-red-700" },
        ].map(s => (
          <Card key={s.label} className={`border-0 shadow-sm ${s.bg}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.text}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="İlan veya şoför ara..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[{k:"all",l:"Tümü"},{k:"pending",l:"Bekleyen"},{k:"accepted",l:"Kabul"},{k:"rejected",l:"Reddedilen"}].map(f => (
            <Button key={f.k} size="sm" variant={filter===f.k?"default":"outline"} onClick={() => setFilter(f.k)}>{f.l}</Button>
          ))}
        </div>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {filtered.map(offer => {
          const st = STATUS_MAP[offer.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pending;
          const isPending = offer.status === "pending";
          return (
            <Card key={offer.id} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Driver Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-12 w-12 border-2 border-border">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {offer.driverName.split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{offer.driverName}</p>
                        <div className="flex items-center gap-0.5 text-yellow-500">
                          <Star className="w-3.5 h-3.5 fill-yellow-400" />
                          <span className="text-xs font-medium">{offer.driverRating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">({offer.driverShipments} sefer)</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Package className="w-3 h-3" />{offer.loadTitle}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Truck className="w-3 h-3" />{offer.vehicleType} · {offer.vehiclePlate}
                      </p>
                      {offer.note && (
                        <p className="text-sm text-gray-700 mt-2 bg-gray-50 rounded-lg p-2.5 italic">
                          "{offer.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{offer.amount.toLocaleString("tr-TR")} ₺</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <TrendingDown className="w-3 h-3 text-green-500" />
                        <span>Teklif fiyatı</span>
                      </div>
                    </div>
                    <Badge variant={st.variant} className="gap-1">{st.icon}{st.label}</Badge>
                    <p className="text-xs text-muted-foreground">{offer.createdAt}</p>
                    {isPending && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => rejectOffer({ id: offer.id })}>
                          <XCircle className="w-3.5 h-3.5" /> Reddet
                        </Button>
                        <Button size="sm" className="gap-1" onClick={() => acceptOffer({ id: offer.id })}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Kabul Et
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="font-medium text-muted-foreground">Teklif bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}
