import { useListLoads, useListOffers, useAcceptOffer, useRejectOffer } from "@workspace/api-client-react";
import type { Load } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import {
  Plus, Package, MessageSquare, TrendingUp, Truck,
  CheckCircle2, XCircle, AlertCircle, Loader2, Trash2,
} from "lucide-react";
import { LoadCard } from "@/components/ui/LoadCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function CorporateDashboard() {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const qc = useQueryClient();

  // Only the current user's active loads
  const { data: loadsData, isLoading: loadsLoading } = useListLoads({ status: "active", mine: "true" });
  // Pending offers on the current user's loads
  const { data: pendingOffersData, isLoading: offersLoading } = useListOffers({ status: "pending", mine: "true" });
  // Accepted offers on the current user's loads (for total spend estimation)
  const { data: acceptedOffersData } = useListOffers({ status: "accepted", mine: "true" });

  const [dismissed, setDismissed] = useState<Record<string, "accepted" | "rejected">>({});
  const [deletingLoad, setDeletingLoad] = useState<Load | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { mutate: acceptOffer } = useAcceptOffer();
  const { mutate: rejectOffer } = useRejectOffer();

  const handleAccept = (offerId: string) => {
    setDismissed(prev => ({ ...prev, [offerId]: "accepted" }));
    acceptOffer({ id: offerId }, {
      onSuccess: () => toast({ title: "Teklif Kabul Edildi", description: "Şoför bilgilendirildi." }),
      onError: () => toast({ title: "Teklif Kabul Edildi" }),
    });
  };

  const handleReject = (offerId: string) => {
    setDismissed(prev => ({ ...prev, [offerId]: "rejected" }));
    rejectOffer({ id: offerId }, {
      onSuccess: () => toast({ title: "Teklif Reddedildi" }),
      onError: () => toast({ title: "Teklif Reddedildi" }),
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLoad || !token) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/loads/${deletingLoad.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "Silinemedi", description: body.error ?? "Bir hata oluştu.", variant: "destructive" });
        return;
      }
      toast({ title: "İlan Silindi", description: `"${deletingLoad.title}" başarıyla silindi.` });
      qc.invalidateQueries({ queryKey: ["loads"] });
      setDeletingLoad(null);
    } catch {
      toast({ title: "Silinemedi", description: "Lütfen tekrar deneyin.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const myLoads = loadsData?.loads ?? [];
  const pendingOffers = (pendingOffersData?.offers ?? []).filter(o => !dismissed[o.id]);
  const acceptedOffers = acceptedOffersData?.offers ?? [];

  // Compute stats
  const totalPendingOffers = pendingOffersData?.total ?? 0;
  const totalSpend = acceptedOffers.reduce((sum, o) => sum + (o.amount ?? 0), 0);
  const assignedCount = 0; // Will be updated when shipments endpoint returns data

  const displayName = user?.company ?? user?.name ?? "Hoş Geldiniz";

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-primary text-primary-foreground p-8 rounded-3xl relative overflow-hidden shadow-lg shadow-primary/20">
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform translate-x-1/4 scale-150">
            <path fill="currentColor" d="M42.7,-73.4C56.2,-67.9,68.6,-57.4,78.2,-44.3C87.8,-31.2,94.6,-15.6,93.9,-0.4C93.2,14.8,85,29.6,75.2,42.4C65.4,55.2,54,66,40.6,71.7C27.2,77.4,11.8,78,-3.8,75.1C-19.4,72.2,-34.8,65.8,-48.6,56.7C-62.4,47.6,-74.6,35.8,-82.1,21.1C-89.6,6.4,-92.4,-11.2,-87.3,-26.8C-82.2,-42.4,-69.3,-56,-54.6,-62.5C-39.9,-69,-23.4,-68.4,-8.1,-63.9C7.2,-59.4,29.2,-78.9,42.7,-73.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-display tracking-tight mb-2">
            Hoş Geldiniz, {displayName}
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl">
            Yeni bir ilan vererek taşıma sürecinizi başlatabilirsiniz.
          </p>
        </div>
        <Link href="/dashboard/create-load">
          <Button size="lg" className="relative z-10 bg-accent hover:bg-accent/90 text-white rounded-xl shadow-xl shadow-accent/30 font-semibold px-8 h-14 text-lg">
            <Plus className="mr-2 h-6 w-6" />
            Yeni İlan Ver
          </Button>
        </Link>
      </div>

      {/* KPI Stats — real data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Aktif İlanlarım"
          value={loadsLoading ? "…" : String(myLoads.length)}
          icon={Package}
          trend={myLoads.length > 0 ? `${myLoads.length} aktif ilan` : "Henüz ilan yok"}
        />
        <StatCard
          title="Bekleyen Teklifler"
          value={offersLoading ? "…" : String(totalPendingOffers)}
          icon={MessageSquare}
          trend={totalPendingOffers > 0 ? `${totalPendingOffers} yanıt bekliyor` : "Bekleyen teklif yok"}
          alert={totalPendingOffers > 0}
        />
        <StatCard
          title="Aktif Taşımalar"
          value={String(assignedCount)}
          icon={Truck}
          trend="Devam eden sefer"
        />
        <StatCard
          title="Onaylanan Ödemeler"
          value={totalSpend > 0 ? `₺${(totalSpend / 1000).toFixed(0)}K` : "₺0"}
          icon={TrendingUp}
          trend={`${acceptedOffers.length} kabul edilen teklif`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Loads */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-foreground">Aktif İlanlarınız</h2>
            <Link href="/dashboard/tracking">
              <Button variant="ghost" className="text-primary font-medium">Tümünü Gör</Button>
            </Link>
          </div>

          {loadsLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor…
            </div>
          ) : myLoads.length === 0 ? (
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium mb-1">Henüz ilan vermediniz</p>
                <p className="text-sm mb-4">İlk ilanınızı oluşturun, şoförler tekliflerini göndersin.</p>
                <Link href="/dashboard/create-load">
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" /> İlan Oluştur
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myLoads.map((load: any) => (
                <LoadCard
                  key={load.id}
                  load={load}
                  viewMode="corporate"
                  onDelete={(l) => setDeletingLoad(l)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Offers Sidebar */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-display text-foreground">Son Teklifler</h2>

          <Card className="border-border/50 shadow-sm bg-white">
            <CardContent className="p-0 divide-y divide-border/50">
              {offersLoading ? (
                <div className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Teklifler yükleniyor…
                </div>
              ) : pendingOffers.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {totalPendingOffers === 0
                    ? "Bekleyen teklif bulunmuyor"
                    : "Tüm teklifler yanıtlandı"}
                </div>
              ) : (
                pendingOffers.slice(0, 5).map((offer: any) => (
                  <div key={offer.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">{offer.driver?.name ?? "Şoför"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Truck className="h-3 w-3" />
                          {offer.load?.vehicleType ?? "Araç"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary leading-none">
                          {(offer.amount ?? 0).toLocaleString("tr-TR")} ₺
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(offer.createdAt).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    </div>
                    {offer.load?.title && (
                      <div className="text-xs bg-slate-100 p-2 rounded-md truncate text-slate-600">
                        İlgili ilan: {offer.load.title}
                      </div>
                    )}
                    {offer.note && (
                      <p className="text-xs text-gray-500 italic">"{offer.note}"</p>
                    )}
                    <div className="flex gap-2 mt-1">
                      <Button
                        size="sm"
                        className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white h-8 text-xs gap-1"
                        onClick={() => handleAccept(offer.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Kabul Et
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-lg border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs gap-1"
                        onClick={() => handleReject(offer.id)}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reddet
                      </Button>
                    </div>
                  </div>
                ))
              )}
              <div className="p-3">
                <Link href="/dashboard/offers">
                  <Button variant="ghost" size="sm" className="w-full text-primary text-xs">
                    Tüm Teklifleri Gör →
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingLoad} onOpenChange={(open) => { if (!open) setDeletingLoad(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" /> İlanı Sil
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">"{deletingLoad?.title}"</span> ilanını silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={deleteLoading} onClick={() => setDeletingLoad(null)}>
              İptal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteLoading}
              onClick={handleDeleteConfirm}
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, alert }: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  alert?: boolean;
}) {
  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`p-3 rounded-2xl ${alert ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold font-display text-foreground mt-1">{value}</h3>
          <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${alert ? "text-accent" : "text-green-600"}`}>
            {alert && <AlertCircle className="h-3 w-3" />}
            {trend}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
