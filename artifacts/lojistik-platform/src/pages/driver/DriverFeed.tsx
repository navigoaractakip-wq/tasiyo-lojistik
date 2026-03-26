import { useState } from "react";
import { useListLoads, useCreateOffer, useListOffers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListOffersQueryKey } from "@workspace/api-client-react";
import { Search, Filter, BellRing, MapPin, Weight, Truck, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Load = {
  id: string;
  title: string;
  origin: string;
  destination: string;
  weight?: number | null;
  loadType: string;
  vehicleType: string;
  pricingModel: string;
  price?: number | null;
  status: string;
  createdAt: string | Date;
  isPremium?: boolean;
};

function OfferDialog({
  load,
  onClose,
  onOfferSuccess,
}: {
  load: Load;
  onClose: () => void;
  onOfferSuccess: (loadId: string) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [price, setPrice] = useState(load.price ? String(load.price) : "");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { mutate: createOffer, isPending } = useCreateOffer({
    mutation: {
      onSuccess: () => {
        setSubmitted(true);
        onOfferSuccess(load.id);
        queryClient.invalidateQueries({ queryKey: getListOffersQueryKey({ byMe: "true" }) });
      },
      onError: (err: any) => {
        const msg = err?.data?.message ?? err?.message ?? "Teklif gönderilemedi.";
        if (msg.includes("bekleyen")) {
          toast({ title: "Tekrar teklif verilmez", description: "Bu ilana zaten bekleyen bir teklifiniz var.", variant: "destructive" });
        } else if (err?.status === 401) {
          toast({ title: "Giriş Gerekli", description: "Teklif vermek için lütfen giriş yapın.", variant: "destructive" });
        } else {
          toast({ title: "Hata", description: msg, variant: "destructive" });
        }
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(price);
    if (!price || isNaN(amount) || amount <= 0) {
      toast({ title: "Hata", description: "Geçerli bir fiyat giriniz.", variant: "destructive" });
      return;
    }
    createOffer({
      data: {
        loadId: load.id,
        amount,
        note: note.trim() || undefined,
      },
    });
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
        <DialogDescription className="text-xs leading-relaxed">{load.title}</DialogDescription>
      </DialogHeader>

      <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm mb-1">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-3.5 h-3.5 text-green-500 shrink-0" /><span>{load.origin}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" /><span>{load.destination}</span>
        </div>
        <div className="flex gap-4 text-xs text-gray-500 pt-1 border-t border-gray-100">
          {load.weight != null && (
            <span className="flex items-center gap-1"><Weight className="w-3 h-3" />{load.weight} ton</span>
          )}
          <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{load.vehicleType}</span>
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
          {load.price ? (
            <p className="text-xs text-muted-foreground mt-1">
              İlan fiyatı: <span className="font-semibold text-green-600">{load.price.toLocaleString("tr-TR")} ₺</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Açık teklif ilanı — fiyatınızı belirleyin</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium">Not (opsiyonel)</Label>
          <Textarea
            placeholder="Araç bilgisi, uygunluk tarihi vb..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="mt-1 resize-none h-20 text-sm"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
            Vazgeç
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? "Gönderiliyor..." : "Teklif Gönder"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export default function DriverFeed() {
  const { data, isLoading } = useListLoads({ status: "active" });
  const { data: myOffersData } = useListOffers({ byMe: "true" });
  const [offerLoad, setOfferLoad] = useState<Load | null>(null);
  const [search, setSearch] = useState("");
  const [localOfferedIds, setLocalOfferedIds] = useState<Set<string>>(new Set());

  const allLoads: Load[] = (data?.loads ?? []) as Load[];
  const loads = allLoads.filter(l =>
    !search ||
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.origin.toLowerCase().includes(search.toLowerCase()) ||
    l.destination.toLowerCase().includes(search.toLowerCase())
  );

  // Build set of load IDs that the driver already offered on
  const offeredLoadIds = new Set<string>([
    ...((myOffersData?.offers ?? []).map((o: any) => String(o.loadId))),
    ...localOfferedIds,
  ]);

  const handleOfferSuccess = (loadId: string) => {
    setLocalOfferedIds(prev => new Set([...prev, loadId]));
  };

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Search Header */}
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-bold text-white mb-4">Sana Uygun Yükler</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10 h-12 rounded-xl border-0 shadow-inner bg-white/95 text-gray-900 placeholder:text-gray-500"
              placeholder="Rota veya şehir ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button
            size="icon"
            className="h-12 w-12 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/10"
            onClick={() => setSearch("")}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Alert banner */}
      <div className="px-4 -mt-4 relative z-10 mb-6">
        <div className="bg-accent text-white rounded-xl p-3 shadow-lg shadow-accent/20 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <BellRing className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">
              {isLoading ? "Yükler getiriliyor…" : `${allLoads.length} aktif ilan mevcut`}
            </p>
            <p className="text-xs text-white/80">Hepsine teklif verebilirsiniz</p>
          </div>
        </div>
      </div>

      {/* Feed list */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-800">Aktif İlanlar</h2>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
            {loads.length} ilan
          </span>
        </div>

        {isLoading && (
          <div className="py-12 text-center text-sm text-muted-foreground">Yükler getiriliyor…</div>
        )}

        {!isLoading && loads.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {search ? "Arama kriterlerine uygun ilan bulunamadı." : "Şu an aktif ilan bulunmuyor."}
          </div>
        )}

        {loads.map(load => {
          const alreadyOffered = offeredLoadIds.has(String(load.id));
          return (
            <Card key={load.id} className="shadow-sm border-0 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm leading-snug pr-2">{load.title}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {alreadyOffered && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0 font-semibold gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Teklif Verildi
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{load.loadType}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <div className="w-px h-3 bg-gray-200" />
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  </div>
                  <div className="text-xs space-y-0.5 flex-1">
                    <p className="text-gray-700">{load.origin}</p>
                    <p className="text-gray-700">{load.destination}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                  <div>
                    {load.pricingModel === "bidding"
                      ? <span className="text-blue-600 font-semibold text-sm">Açık Teklif</span>
                      : <span className="text-green-600 font-bold">{load.price?.toLocaleString("tr-TR")} ₺</span>
                    }
                  </div>
                  {alreadyOffered ? (
                    <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 h-8 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Teklif Verildi
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 px-4 rounded-xl text-xs"
                      onClick={() => setOfferLoad(load)}
                    >
                      Teklif Ver
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!offerLoad} onOpenChange={open => !open && setOfferLoad(null)}>
        {offerLoad && (
          <OfferDialog
            load={offerLoad}
            onClose={() => setOfferLoad(null)}
            onOfferSuccess={handleOfferSuccess}
          />
        )}
      </Dialog>
    </div>
  );
}
