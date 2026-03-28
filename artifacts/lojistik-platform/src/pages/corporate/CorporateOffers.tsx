import { useState } from "react";
import { useListOffers, useAcceptOffer, useRejectOffer, getListOffersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageSquare, Search, CheckCircle2, XCircle, Clock,
  Star, Truck, Package, TrendingDown, Loader2, Phone, Mail,
  AlertTriangle, Undo2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";

const STATUS_MAP: Record<string, { label: string; variant: "secondary" | "default" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending:   { label: "Bekliyor",      variant: "secondary",   icon: <Clock className="w-3 h-3" /> },
  accepted:  { label: "Kabul Edildi",  variant: "default",     icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:  { label: "Reddedildi",    variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
  withdrawn: { label: "Geri Çekildi",  variant: "outline",     icon: <Undo2 className="w-3 h-3" /> },
};

export default function CorporateOffers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useListOffers({ mine: "true" } as any);
  const [localStatuses, setLocalStatuses] = useState<Record<string, OfferStatus>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { mutate: acceptOfferMutate } = useAcceptOffer();
  const { mutate: rejectOfferMutate } = useRejectOffer();

  const rawOffers = (data?.offers ?? []) as any[];
  const offers = rawOffers.map(o => ({
    ...o,
    driverName: o.driver?.name ?? o.driverName ?? "—",
    driverEmail: o.driver?.email ?? "",
    driverPhone: o.driver?.phone ?? "",
    loadTitle: o.load?.title ?? o.loadTitle ?? "—",
    loadPickupDate: o.load?.pickupDate,
    driverRating: o.driver?.rating ?? o.driverRating ?? 0,
    driverShipments: o.driver?.totalShipments ?? o.driverShipments ?? 0,
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
    withdrawn: offers.filter(o => o.status === "withdrawn").length,
  };

  const handleAccept = (offerId: string) => {
    setLoadingId(offerId);
    setLocalStatuses(prev => ({ ...prev, [offerId]: "accepted" }));
    acceptOfferMutate(
      { id: offerId },
      {
        onSuccess: () => {
          toast({ title: "Teklif Kabul Edildi", description: "Şoförün iletişim bilgilerini görebilirsiniz." });
          setLoadingId(null);
          refetch();
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

  const handleCancelAccepted = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      const base = import.meta.env.BASE_URL ?? "/";
      const url = `${base}api/offers/${cancelTarget}/cancel-accepted`.replace(/\/+/g, "/").replace(":/", "://");
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "İptal işlemi başarısız.");
      }
      toast({ title: "Teklip Kabulü İptal Edildi", description: "Yük ilanı tekrar teklif almaya açıldı." });
      setLocalStatuses(prev => ({ ...prev, [cancelTarget]: "pending" }));
      queryClient.invalidateQueries({ queryKey: getListOffersQueryKey({ mine: "true" } as any) });
      refetch();
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    } finally {
      setIsCancelling(false);
      setCancelTarget(null);
    }
  };

  // 1 günden fazla kala iptal edilebilir mi?
  const canCancelAccepted = (offer: any): boolean => {
    if (!offer.loadPickupDate) return true;
    const msRemaining = new Date(offer.loadPickupDate).getTime() - Date.now();
    return msRemaining > 24 * 60 * 60 * 1000;
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
              {isLoading
                ? <Skeleton className="h-9 w-12 mt-1" />
                : <p className={`text-3xl font-bold mt-1 ${s.text}`}>{s.value}</p>
              }
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
          {[
            {k:"all",l:"Tümü"},
            {k:"pending",l:"Bekleyen"},
            {k:"accepted",l:"Kabul"},
            {k:"rejected",l:"Reddedilen"},
            {k:"withdrawn",l:"Geri Çekilen"},
          ].map(f => (
            <Button key={f.k} size="sm" variant={filter === f.k ? "default" : "outline"} onClick={() => setFilter(f.k)}>
              {f.l}
            </Button>
          ))}
        </div>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-7 w-24 ml-auto" />
                  <Skeleton className="h-5 w-20 ml-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isLoading && filtered.map(offer => {
          const st = STATUS_MAP[offer.status] ?? STATUS_MAP.pending;
          const isPending = offer.status === "pending";
          const isAccepted = offer.status === "accepted";
          const isOfferLoading = loadingId === offer.id;
          const canCancel = isAccepted && canCancelAccepted(offer);

          return (
            <Card key={offer.id} className={`shadow-sm ${isAccepted ? "ring-2 ring-green-200" : ""}`}>
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Driver Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-12 w-12 border-2 border-border shrink-0">
                      <AvatarFallback className={`font-bold ${isAccepted ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}>
                        {offer.driverName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
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
                        <Truck className="w-3 h-3 shrink-0" />{offer.vehicleType}
                      </p>

                      {/* İletişim bilgileri — yalnızca kabul edilmiş tekliflerde */}
                      {isAccepted && (
                        <div className="mt-3 space-y-1.5 bg-green-50 border border-green-100 rounded-xl p-3">
                          <p className="text-xs font-semibold text-green-700 mb-1">📞 Şoför İletişim Bilgileri</p>
                          {offer.driverPhone && (
                            <a
                              href={`tel:${offer.driverPhone}`}
                              className="flex items-center gap-2 text-sm text-green-800 hover:text-green-600 font-medium"
                            >
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              {offer.driverPhone}
                            </a>
                          )}
                          {offer.driverEmail && (
                            <a
                              href={`mailto:${offer.driverEmail}`}
                              className="flex items-center gap-2 text-sm text-green-800 hover:text-green-600"
                            >
                              <Mail className="w-3.5 h-3.5 shrink-0" />
                              {offer.driverEmail}
                            </a>
                          )}
                          {!offer.driverPhone && !offer.driverEmail && (
                            <p className="text-xs text-green-600 italic">İletişim bilgisi girilmemiş</p>
                          )}
                        </div>
                      )}

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
                    <Badge variant={st.variant as any} className="gap-1">{st.icon}{st.label}</Badge>
                    <p className="text-xs text-muted-foreground">{offer.createdAt}</p>

                    {isPending && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                          disabled={isOfferLoading}
                          onClick={() => handleReject(offer.id)}
                        >
                          {isOfferLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          Reddet
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700"
                          disabled={isOfferLoading}
                          onClick={() => handleAccept(offer.id)}
                        >
                          {isOfferLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Kabul Et
                        </Button>
                      </div>
                    )}

                    {isAccepted && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`gap-1 text-xs ${canCancel ? "border-orange-200 text-orange-600 hover:bg-orange-50" : "opacity-50 cursor-not-allowed"}`}
                        disabled={!canCancel}
                        title={!canCancel ? "Yükleme gününe 1 günden az kaldığı için iptal edilemez" : ""}
                        onClick={() => canCancel && setCancelTarget(offer.id)}
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        Kabulü İptal Et
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="font-medium text-muted-foreground">
              {offers.length === 0 ? "Henüz hiç teklif gelmedi" : "Teklif bulunamadı"}
            </p>
            {offers.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">Yük ilanı oluşturduğunuzda şoförler teklif gönderebilir</p>
            )}
          </div>
        )}
      </div>

      {/* Cancel Accepted Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={open => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <DialogTitle>Teklif Kabulünü İptal Et</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Kabul ettiğiniz bu teklifi iptal etmek istediğinizden emin misiniz?
              İptal edildiğinde yük ilanı tekrar <strong>aktif</strong> duruma geçer ve şoföre bildirim gönderilir.
              Bu işlem <strong>yükleme tarihine 1 gün kalana kadar</strong> yapılabilir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={isCancelling}
              className="flex-1"
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelAccepted}
              disabled={isCancelling}
              className="flex-1"
            >
              {isCancelling
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> İşleniyor…</>
                : <><Undo2 className="w-4 h-4 mr-2" /> İptal Et</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
