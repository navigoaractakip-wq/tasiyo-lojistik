import { useState, useMemo } from "react";
import { useListOffers, getListOffersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin, Clock, CheckCircle2, XCircle, Hourglass,
  Loader2, FileText, TrendingUp, TrendingDown, Minus,
  Undo2, AlertTriangle, Phone, Mail, Building2, CalendarDays,
} from "lucide-react";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, subYears } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

type Tab = "pending" | "history";

type TimeFilter = "today" | "week" | "month" | "year" | "3years";
type StatusFilter = "all" | "accepted" | "rejected" | "withdrawn";

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: "today",  label: "Bugün"    },
  { key: "week",   label: "Bu Hafta" },
  { key: "month",  label: "Bu Ay"    },
  { key: "year",   label: "Bu Yıl"   },
  { key: "3years", label: "3 Yıl"    },
];

function getFilterStart(filter: TimeFilter): Date {
  const now = new Date();
  switch (filter) {
    case "today":  return startOfDay(now);
    case "week":   return startOfWeek(now, { locale: tr });
    case "month":  return startOfMonth(now);
    case "year":   return startOfYear(now);
    case "3years": return subYears(startOfDay(now), 3);
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 font-semibold">
          <Hourglass className="w-3 h-3" /> Beklemede
        </Badge>
      );
    case "accepted":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 font-semibold">
          <CheckCircle2 className="w-3 h-3" /> Kabul Edildi
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 font-semibold">
          <XCircle className="w-3 h-3" /> Reddedildi
        </Badge>
      );
    case "withdrawn":
      return (
        <Badge className="bg-gray-100 text-gray-500 border-gray-200 gap-1 font-semibold">
          <Undo2 className="w-3 h-3" /> Geri Çekildi
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function OfferCard({ offer, onWithdraw }: { offer: any; onWithdraw?: (id: string) => void }) {
  const load = offer.load;
  const isPending = offer.status === "pending";
  const isAccepted = offer.status === "accepted";
  const isWithdrawn = offer.status === "withdrawn";

  const headerClass = isAccepted
    ? "bg-green-50 border-b border-green-100"
    : isPending
    ? "bg-amber-50 border-b border-amber-100"
    : isWithdrawn
    ? "bg-gray-50 border-b border-gray-100"
    : "bg-red-50 border-b border-red-100";

  const ringClass = isAccepted
    ? "ring-1 ring-green-200"
    : isPending
    ? "ring-1 ring-amber-200"
    : "";

  return (
    <Card className={`shadow-sm border-0 overflow-hidden ${ringClass}`}>
      <CardContent className="p-0">
        {/* Status bar */}
        <div className={`px-4 py-2 flex items-center justify-between ${headerClass}`}>
          <StatusBadge status={offer.status} />
          <span className="text-xs text-muted-foreground">
            {format(new Date(offer.createdAt), "d MMM yyyy, HH:mm", { locale: tr })}
          </span>
        </div>

        <div className="p-4 space-y-3">
          {/* Load route */}
          {load ? (
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight mb-2">{load.title}</p>
              <div className="flex items-start gap-2.5">
                <div className="flex flex-col items-center gap-0.5 mt-1 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="w-px h-3 bg-gray-200" />
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
                <div className="text-xs space-y-1.5 text-gray-600 flex-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-green-500 shrink-0" />
                    <span>{load.origin}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                    <span>{load.destination}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">İlan bilgisi bulunamadı</p>
          )}

          {/* Price comparison */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Teklifim</p>
              <p className={`text-xl font-bold ${isWithdrawn ? "text-gray-400 line-through" : "text-primary"}`}>
                {offer.amount.toLocaleString("tr-TR")} ₺
              </p>
            </div>
            {load?.price && (
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">İlan Fiyatı</p>
                <div className="flex items-center gap-1 justify-end">
                  {offer.amount < load.price ? (
                    <TrendingDown className="w-3.5 h-3.5 text-green-500" />
                  ) : offer.amount > load.price ? (
                    <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <p className="text-sm font-semibold text-gray-600">{load.price.toLocaleString("tr-TR")} ₺</p>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          {offer.note && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 rounded-lg p-2.5">
              <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
              <span className="italic">"{offer.note}"</span>
            </div>
          )}

          {/* Accepted notice + Poster contact */}
          {isAccepted && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-3 py-2 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Teklifiniz kabul edildi!
              </div>
              {load?.postedBy && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1.5 text-sm">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Firma İletişim Bilgileri</p>
                  {load.postedBy.company && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-medium">{load.postedBy.company}</span>
                    </div>
                  )}
                  {load.postedBy.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-xs">{load.postedBy.address}</span>
                    </div>
                  )}
                  {load.postedBy.phone && (
                    <a href={`tel:${load.postedBy.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium">{load.postedBy.phone}</span>
                    </a>
                  )}
                  {load.postedBy.email && (
                    <a href={`mailto:${load.postedBy.email}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs">{load.postedBy.email}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Withdrawn notice */}
          {isWithdrawn && (
            <div className="flex items-center gap-2 bg-gray-50 text-gray-500 rounded-xl px-3 py-2 text-xs font-medium">
              <Undo2 className="w-4 h-4 shrink-0" />
              Bu teklifinizi geri çektiniz.
            </div>
          )}

          {/* Withdraw button — pending veya accepted */}
          {(isPending || isAccepted) && onWithdraw && (
            <Button
              variant="outline"
              size="sm"
              className={`w-full rounded-xl gap-2 h-9 ${
                isAccepted
                  ? "border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                  : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              }`}
              onClick={() => onWithdraw(offer.id)}
            >
              <Undo2 className="w-3.5 h-3.5" />
              {isAccepted ? "Kabul Edilmiş Teklifi Geri Çek" : "Teklifi Geri Çek"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DriverOffers() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [withdrawTarget, setWithdrawTarget] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingData, isLoading: pendingLoading } = useListOffers({ byMe: "true", status: "pending" });
  const { data: historyData, isLoading: historyLoading } = useListOffers({ byMe: "true" });

  const pendingOffers = pendingData?.offers ?? [];
  const allOffers = historyData?.offers ?? [];
  const allHistoryOffers = allOffers.filter(o => o.status !== "pending");

  // Yalnızca zaman filtresine göre
  const timeFilteredOffers = useMemo(() => {
    const since = getFilterStart(timeFilter);
    return allHistoryOffers.filter(o => new Date(o.createdAt) >= since);
  }, [allHistoryOffers, timeFilter]);

  // Zaman + durum filtresine göre (listede gösterilenler)
  const displayedOffers = useMemo(() => {
    if (statusFilter === "all") return timeFilteredOffers;
    return timeFilteredOffers.filter(o => o.status === statusFilter);
  }, [timeFilteredOffers, statusFilter]);

  const totalCount    = timeFilteredOffers.length;
  const acceptedCount = timeFilteredOffers.filter(o => o.status === "accepted").length;
  const rejectedCount = timeFilteredOffers.filter(o => o.status === "rejected").length;

  const toggleStatus = (s: StatusFilter) =>
    setStatusFilter(prev => (prev === s ? "all" : s));

  const handleWithdrawConfirm = async () => {
    if (!withdrawTarget) return;
    setIsWithdrawing(true);
    try {
      const base = import.meta.env.BASE_URL ?? "/";
      const res = await fetch(`${base}api/offers/${withdrawTarget}/withdraw`.replace(/\/+/g, "/").replace(":/", "://"), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Teklif geri çekilemedi.");
      }
      toast({ title: "Teklif geri çekildi", description: "Teklifiniz başarıyla iptal edildi." });
      queryClient.invalidateQueries({ queryKey: getListOffersQueryKey({ byMe: "true" }) });
      queryClient.invalidateQueries({ queryKey: getListOffersQueryKey({ byMe: "true", status: "pending" }) });
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    } finally {
      setIsWithdrawing(false);
      setWithdrawTarget(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-bold text-white mb-1">Tekliflerim</h1>
        <p className="text-blue-200 text-sm mb-4">
          {pendingOffers.length > 0
            ? `${pendingOffers.length} bekleyen teklif`
            : "Bekleyen teklif yok"}
        </p>
        <div className="flex gap-2">
          {(["pending", "history"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === tab ? "bg-white text-primary shadow-sm" : "text-white/70 hover:text-white"
              }`}
            >
              {tab === "pending" ? (
                <>
                  <Hourglass className="w-3.5 h-3.5" /> Bekleyen
                  {pendingOffers.length > 0 && (
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      activeTab === tab ? "bg-accent text-white" : "bg-white/20 text-white"
                    }`}>
                      {pendingOffers.length}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" /> Geçmiş
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {activeTab === "pending" && (
          <>
            {pendingLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor…
              </div>
            ) : pendingOffers.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Hourglass className="w-12 h-12 text-gray-200 mx-auto" />
                <p className="font-medium text-gray-500">Bekleyen teklifiniz yok</p>
                <p className="text-xs text-muted-foreground">Yük ilanlarına teklif vererek buradan takip edebilirsiniz.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingOffers.map((offer: any) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onWithdraw={setWithdrawTarget}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <>
            {/* Zaman Filtresi */}
            <div className="-mx-4 px-4 pb-1">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                {TIME_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setTimeFilter(f.key)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      timeFilter === f.key
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats — tıklanabilir durum filtresi */}
            {!historyLoading && allHistoryOffers.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-1">
                {/* Toplam */}
                <button
                  onClick={() => toggleStatus("all")}
                  className={`rounded-xl text-center p-3 shadow-sm border-2 transition-all bg-white ${
                    statusFilter === "all"
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-primary/30"
                  }`}
                >
                  <p className="text-xl font-bold text-primary">{totalCount}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Toplam</p>
                  {statusFilter === "all" && (
                    <span className="mt-1 inline-block text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">Aktif</span>
                  )}
                </button>

                {/* Kabul */}
                <button
                  onClick={() => toggleStatus("accepted")}
                  className={`rounded-xl text-center p-3 shadow-sm border-2 transition-all bg-white ${
                    statusFilter === "accepted"
                      ? "border-green-500 ring-2 ring-green-200"
                      : "border-transparent hover:border-green-300"
                  }`}
                >
                  <p className="text-xl font-bold text-green-600">{acceptedCount}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Kabul</p>
                  {statusFilter === "accepted" && (
                    <span className="mt-1 inline-block text-[10px] font-semibold text-green-600 bg-green-100 rounded-full px-2 py-0.5">Aktif</span>
                  )}
                </button>

                {/* Red */}
                <button
                  onClick={() => toggleStatus("rejected")}
                  className={`rounded-xl text-center p-3 shadow-sm border-2 transition-all bg-white ${
                    statusFilter === "rejected"
                      ? "border-red-500 ring-2 ring-red-200"
                      : "border-transparent hover:border-red-300"
                  }`}
                >
                  <p className="text-xl font-bold text-red-500">{rejectedCount}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Red</p>
                  {statusFilter === "rejected" && (
                    <span className="mt-1 inline-block text-[10px] font-semibold text-red-500 bg-red-100 rounded-full px-2 py-0.5">Aktif</span>
                  )}
                </button>
              </div>
            )}

            {historyLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor…
              </div>
            ) : displayedOffers.length === 0 ? (
              <div className="text-center py-14 space-y-2">
                <CalendarDays className="w-12 h-12 text-gray-200 mx-auto" />
                <p className="font-medium text-gray-500">
                  {allHistoryOffers.length === 0
                    ? "Geçmiş teklif yok"
                    : statusFilter !== "all"
                    ? `${TIME_FILTERS.find(f => f.key === timeFilter)?.label} içinde ${statusFilter === "accepted" ? "kabul edilen" : "reddedilen"} teklif yok`
                    : `${TIME_FILTERS.find(f => f.key === timeFilter)?.label} döneminde teklif yok`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {allHistoryOffers.length === 0
                    ? "Kabul edilen ve reddedilen teklifleriniz burada görünür."
                    : "Farklı bir zaman aralığı veya durum seçebilirsiniz."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayedOffers.map((offer: any) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onWithdraw={offer.status === "accepted" ? setWithdrawTarget : undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Withdraw Confirmation Dialog */}
      <Dialog open={!!withdrawTarget} onOpenChange={open => !open && setWithdrawTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle>Teklifi Geri Çek</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Bu teklifi geri çekmek istediğinizden emin misiniz?
              {(() => {
                const offer = [...(pendingOffers as any[]), ...(historyOffers as any[])].find((o: any) => o.id === withdrawTarget);
                return offer?.status === "accepted"
                  ? " Kabul edilmiş teklif geri çekilirse yük ilanı tekrar aktif duruma geçer."
                  : " Geri çekilen teklifler yeniden aktifleştirilemez. Aynı ilana yeni bir teklif verebilirsiniz.";
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setWithdrawTarget(null)}
              disabled={isWithdrawing}
              className="flex-1"
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={handleWithdrawConfirm}
              disabled={isWithdrawing}
              className="flex-1"
            >
              {isWithdrawing ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> İşleniyor…</>
              ) : (
                <><Undo2 className="w-4 h-4 mr-2" /> Geri Çek</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
