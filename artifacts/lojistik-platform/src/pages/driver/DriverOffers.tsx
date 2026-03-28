import { useState } from "react";
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
  Undo2, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

type Tab = "pending" | "history";

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

          {/* Accepted notice */}
          {isAccepted && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-3 py-2 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Teklifiniz kabul edildi! Firma sizinle iletişime geçecek.
            </div>
          )}

          {/* Withdrawn notice */}
          {isWithdrawn && (
            <div className="flex items-center gap-2 bg-gray-50 text-gray-500 rounded-xl px-3 py-2 text-xs font-medium">
              <Undo2 className="w-4 h-4 shrink-0" />
              Bu teklifinizi geri çektiniz.
            </div>
          )}

          {/* Withdraw button — only for pending */}
          {isPending && onWithdraw && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl gap-2 h-9"
              onClick={() => onWithdraw(offer.id)}
            >
              <Undo2 className="w-3.5 h-3.5" />
              Teklifi Geri Çek
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DriverOffers() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [withdrawTarget, setWithdrawTarget] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingData, isLoading: pendingLoading } = useListOffers({ byMe: "true", status: "pending" });
  const { data: historyData, isLoading: historyLoading } = useListOffers({ byMe: "true" });

  const pendingOffers = pendingData?.offers ?? [];
  const allOffers = historyData?.offers ?? [];
  const historyOffers = allOffers.filter(o => o.status !== "pending");
  const acceptedCount = allOffers.filter(o => o.status === "accepted").length;
  const rejectedCount = allOffers.filter(o => o.status === "rejected").length;

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
            {/* Stats */}
            {!historyLoading && allOffers.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-1">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-primary">{allOffers.length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Toplam</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-green-600">{acceptedCount}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Kabul</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-red-500">{rejectedCount}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Red</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {historyLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor…
              </div>
            ) : historyOffers.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Clock className="w-12 h-12 text-gray-200 mx-auto" />
                <p className="font-medium text-gray-500">Geçmiş teklif yok</p>
                <p className="text-xs text-muted-foreground">Kabul edilen ve reddedilen teklifleriniz burada görünür.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {historyOffers.map((offer: any) => (
                  <OfferCard key={offer.id} offer={offer} />
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
              Geri çekilen teklifler <strong>yeniden aktifleştirilemez</strong>.
              Aynı ilana yeni bir teklif verebilirsiniz.
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
