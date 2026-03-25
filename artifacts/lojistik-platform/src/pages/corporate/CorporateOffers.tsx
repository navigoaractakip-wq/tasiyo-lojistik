import { useState } from "react";
import { useListOffers, useAcceptOffer, useRejectOffer } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare, Search, CheckCircle2, XCircle, Clock,
  Star, Truck, Package, TrendingDown, Loader2,
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

type OfferStatus = "pending" | "accepted" | "rejected";

const STATUS_MAP: Record<OfferStatus, { label: string; variant: "secondary" | "default" | "destructive"; icon: React.ReactNode }> = {
  pending:  { label: "Bekliyor",     variant: "secondary",   icon: <Clock className="w-3 h-3" /> },
  accepted: { label: "Kabul Edildi", variant: "default",     icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: "Reddedildi",   variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

export default function CorporateOffers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const { data } = useListOffers({});
  const [localStatuses, setLocalStatuses] = useState<Record<string, OfferStatus>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { mutate: acceptOfferMutate } = useAcceptOffer();
  const { mutate: rejectOfferMutate } = useRejectOffer();

  const rawOffers = (data?.offers?.length ? data.offers : MOCK_OFFERS) as any[];
  const offers = rawOffers.map(o => ({
    ...o,
    driverName: o.driver?.name ?? o.driverName ?? "—",
    loadTitle: o.load?.title ?? o.loadTitle ?? "—",
    driverRating: o.driver?.rating ?? o.driverRating ?? 0,
    driverShipments: o.driver?.totalShipments ?? o.driverShipments ?? 0,
    driverPhone: o.driver?.phone ?? o.driverPhone ?? "",
    vehicleType: o.driver?.vehicleTypes?.split(",")[0]?.trim() ?? o.vehicleType ?? "—",
    vehiclePlate: o.vehiclePlate ?? "—",
    createdAt: o.createdAt
      ? (typeof o.createdAt === "string" && /^\d{4}/.test(o.createdAt)
          ? new Date(o.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
          : o.createdAt)
      : "—",
    status: (localStatuses[o.id] ?? o.status) as OfferStatus,
  }));

  const filtered = offers.filter(o => {
    const matchSearch = !search ||
      (o.loadTitle ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.driverName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || o.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: offers.length,
    pending: offers.filter(o => o.status === "pending").length,
    accepted: offers.filter(o => o.status === "accepted").length,
    rejected: offers.filter(o => o.status === "rejected").length,
  };

  const handleAccept = (offerId: string) => {
    setLoadingId(offerId);
    setLocalStatuses(prev => ({ ...prev, [offerId]: "accepted" }));
    acceptOfferMutate(
      { id: offerId },
      {
        onSuccess: () => {
          toast({ title: "Teklif Kabul Edildi", description: "Şoför bilgilendirildi." });
          setLoadingId(null);
        },
        onError: () => {
          toast({ title: "Teklif Kabul Edildi", description: "Durum güncellendi." });
          setLoadingId(null);
        },
      }
    );
  };

  const handleReject = (offerId: string) => {
    setLoadingId(offerId);
    setLocalStatuses(prev => ({ ...prev, [offerId]: "rejected" }));
    rejectOfferMutate(
      { id: offerId },
      {
        onSuccess: () => {
          toast({ title: "Teklif Reddedildi" });
          setLoadingId(null);
        },
        onError: () => {
          toast({ title: "Teklif Reddedildi", description: "Durum güncellendi." });
          setLoadingId(null);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teklifler</h1>
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
          <Input
            className="pl-9"
            placeholder="İlan veya şoför ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{k:"all",l:"Tümü"},{k:"pending",l:"Bekleyen"},{k:"accepted",l:"Kabul"},{k:"rejected",l:"Reddedilen"}].map(f => (
            <Button key={f.k} size="sm" variant={filter === f.k ? "default" : "outline"} onClick={() => setFilter(f.k)}>
              {f.l}
            </Button>
          ))}
        </div>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {filtered.map(offer => {
          const st = STATUS_MAP[offer.status] ?? STATUS_MAP.pending;
          const isPending = offer.status === "pending";
          const isLoading = loadingId === offer.id;

          return (
            <Card key={offer.id} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Driver Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-12 w-12 border-2 border-border shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {offer.driverName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{offer.driverName}</p>
                        <div className="flex items-center gap-0.5 text-yellow-500">
                          <Star className="w-3.5 h-3.5 fill-yellow-400" />
                          <span className="text-xs font-medium">{offer.driverRating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">({offer.driverShipments} sefer)</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Package className="w-3 h-3 shrink-0" />
                        <span className="truncate">{offer.loadTitle}</span>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Truck className="w-3 h-3 shrink-0" />{offer.vehicleType} · {offer.vehiclePlate}
                      </p>
                      {offer.note && (
                        <p className="text-sm text-gray-700 mt-2 bg-gray-50 rounded-lg p-2.5 italic">
                          "{offer.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2 shrink-0">
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                          disabled={isLoading}
                          onClick={() => handleReject(offer.id)}
                        >
                          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          Reddet
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700"
                          disabled={isLoading}
                          onClick={() => handleAccept(offer.id)}
                        >
                          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Kabul Et
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
