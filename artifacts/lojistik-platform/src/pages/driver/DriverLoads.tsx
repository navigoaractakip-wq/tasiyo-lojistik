import { useState, useEffect } from "react";
import { useListLoads, useCreateOffer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  Search, MapPin, Weight, Truck, Clock, ChevronRight,
  SlidersHorizontal, Package, Star, CheckCircle2, Loader2, Building2,
  Lock, Crown, Zap,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;
function api(path: string) { return `${BASE}api${path}`; }

const TIER_ACCESS: Record<string, string[]> = {
  driver_starter:      ["genel"],
  driver_professional: ["genel", "profesyonel"],
  driver_premium:      ["genel", "profesyonel", "premium"],
};

const TIER_LABEL: Record<string, string> = {
  genel:       "Genel İlan",
  profesyonel: "Profesyonel İlan",
  premium:     "Premium İlan",
};

const TIER_COLOR: Record<string, string> = {
  genel:       "from-blue-500 to-blue-600",
  profesyonel: "from-violet-500 to-purple-600",
  premium:     "from-yellow-400 to-orange-400",
};

type Load = {
  id: string;
  title: string;
  origin: string;
  destination: string;
  weight?: number | null;
  distance?: number | null;
  loadType: string;
  vehicleType: string;
  pricingModel: string;
  price?: number | null;
  status: string;
  isPremium?: boolean;
  tier?: string;
  createdAt: string | Date;
  postedBy?: {
    id: string;
    name: string;
    company?: string | null;
    address?: string | null;
  } | null;
};

const VEHICLE_TYPES = ["Tümü", "TIR", "Kapalı Kasa", "Açık Kasa", "Frigorifik", "Lowbed", "Tenteli TIR"];

function OfferDialog({ load, onClose }: { load: Load; onClose: () => void }) {
  const { toast } = useToast();
  const [price, setPrice] = useState(load.price ? String(load.price) : "");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { mutate: createOffer, isPending } = useCreateOffer({
    mutation: {
      onSuccess: () => setSubmitted(true),
      onError: (err: any) => {
        const msg = err?.data?.message ?? err?.message ?? "Teklif gönderilemedi.";
        if (msg.includes("bekleyen")) {
          toast({ title: "Tekrar teklif verilemez", description: "Bu ilana zaten bekleyen bir teklifiniz var.", variant: "destructive" });
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
    createOffer({ data: { loadId: load.id, amount, note: note.trim() || undefined } });
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
            <strong>{Number(price).toLocaleString("tr-TR")} ₺</strong> teklifiniz sisteme kaydedildi.<br />
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

      {(load.postedBy?.company || load.postedBy?.address) && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-start gap-2 text-sm mb-1">
          <Building2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            {load.postedBy.company && <p className="font-semibold text-blue-800">{load.postedBy.company}</p>}
            {load.postedBy.address && <p className="text-blue-600 text-xs mt-0.5">{load.postedBy.address}</p>}
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm mb-1">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-3.5 h-3.5 text-green-500 shrink-0" /><span>{load.origin}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" /><span>{load.destination}</span>
        </div>
        <div className="flex gap-4 text-xs text-gray-500 pt-1 border-t border-gray-100">
          {load.weight != null && <span><Weight className="w-3 h-3 inline mr-0.5" />{load.weight} ton</span>}
          <span>{load.vehicleType}</span>
          {load.distance != null && <span>{load.distance} km</span>}
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
          {load.price
            ? <p className="text-xs text-muted-foreground mt-1">İlan fiyatı: <span className="font-semibold text-green-600">{load.price.toLocaleString("tr-TR")} ₺</span></p>
            : <p className="text-xs text-muted-foreground mt-1">Açık teklif ilanı — fiyatınızı belirleyin</p>
          }
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
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
            Vazgeç
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Gönderiliyor…</> : "Teklif Gönder"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function TierLockCard({ load }: { load: Load }) {
  const tier = load.tier ?? (load.isPremium ? "premium" : "genel");
  const isProf = tier === "profesyonel";
  const gradFrom = isProf ? "from-violet-500 to-purple-600" : "from-yellow-400 to-orange-400";
  const btnClass = isProf ? "bg-violet-600 hover:bg-violet-700" : "bg-orange-500 hover:bg-orange-600";
  const lockMsg = isProf
    ? "Bu ilanı görmek için Profesyonel veya Premium plan gerekir"
    : "Bu ilanı görmek için Premium plan gerekir";

  return (
    <Card className="shadow-sm border-0 overflow-hidden relative">
      <CardContent className="p-0">
        <div className={`bg-gradient-to-r ${gradFrom} px-3 py-1 flex items-center gap-1`}>
          <Star className="w-3 h-3 text-white fill-white" />
          <span className="text-[11px] text-white font-semibold">{TIER_LABEL[tier] ?? tier}</span>
        </div>
        <div className="p-4 blur-sm select-none pointer-events-none">
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
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {load.weight != null && <span>{load.weight} ton</span>}
            <span>{load.vehicleType}</span>
          </div>
        </div>
      </CardContent>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
        <div className={`${isProf ? "bg-violet-600" : "bg-orange-500"} text-white rounded-full p-2 mb-2 shadow`}>
          <Lock className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-0.5">{TIER_LABEL[tier] ?? tier}</p>
        <p className="text-xs text-slate-500 text-center px-4 mb-3">{lockMsg}</p>
        <a href="/driver/abonelik">
          <Button size="sm" className={`${btnClass} text-white h-7 px-4 text-xs`}>
            <Crown className="w-3.5 h-3.5 mr-1" /> Plana Geç
          </Button>
        </a>
      </div>
    </Card>
  );
}

export default function DriverLoads() {
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("Tümü");
  const [showFilters, setShowFilters] = useState(false);
  const [offerLoad, setOfferLoad] = useState<Load | null>(null);
  const [driverPlan, setDriverPlan] = useState<string>("driver_starter");
  const [subLoaded, setSubLoaded] = useState(false);

  const { token } = useAuth();
  const { data, isLoading } = useListLoads({ status: "active" });

  useEffect(() => {
    if (!token) return;
    fetch(api("/payment/subscription"), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const sub = d.subscription;
        if (sub?.status === "active" && sub?.plan) {
          setDriverPlan(sub.plan);
        } else {
          setDriverPlan("driver_starter");
        }
      })
      .catch(() => {})
      .finally(() => setSubLoaded(true));
  }, [token]);

  const accessibleTiers = TIER_ACCESS[driverPlan] ?? ["genel"];

  const allLoads: Load[] = (data?.loads ?? []) as Load[];
  const filtered = allLoads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.title.toLowerCase().includes(q) || l.origin.toLowerCase().includes(q) || l.destination.toLowerCase().includes(q);
    const matchVehicle = vehicleFilter === "Tümü" || l.vehicleType === vehicleFilter;
    return matchSearch && matchVehicle;
  });

  const lockedCount = subLoaded
    ? allLoads.filter(l => {
        const tier = l.tier ?? (l.isPremium ? "premium" : "genel");
        return !accessibleTiers.includes(tier);
      }).length
    : 0;
  const showUpgradeBanner = subLoaded && lockedCount > 0 && driverPlan !== "driver_premium";

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-bold text-white mb-1">Yük İlanları</h1>
        <p className="text-blue-200 text-sm mb-4">
          {isLoading ? "Yükleniyor…" : `${filtered.length} ilan`}
        </p>
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
          <div className="flex gap-2 overflow-x-auto pb-2">
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

      {/* Upgrade Banner */}
      {showUpgradeBanner && (
        <div className="mx-4 mt-3 bg-gradient-to-r from-violet-600 to-orange-500 rounded-2xl p-4 flex items-center gap-3 shadow">
          <div className="bg-white/20 rounded-full p-2">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">
              {lockedCount} ilan abonelik gerektiriyor
            </p>
            <p className="text-white/80 text-xs">
              {driverPlan === "driver_starter"
                ? "Profesyonel veya Premium planla daha fazla ilan görün"
                : "Premium planla tüm ilanları görün"}
            </p>
          </div>
          <a href="/driver/abonelik">
            <Button size="sm" className="bg-white text-violet-700 hover:bg-violet-50 h-8 px-3 text-xs font-bold">
              Yükselt
            </Button>
          </a>
        </div>
      )}

      {/* Loads List */}
      <div className="px-4 mt-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Yükler getiriliyor…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="font-medium text-muted-foreground">
              {search ? "Arama kriterlerine uygun ilan bulunamadı" : "Şu an aktif ilan yok"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
            {filtered.map(load => {
              const tier = load.tier ?? (load.isPremium ? "premium" : "genel");
              const isLocked = !accessibleTiers.includes(tier);
              if (isLocked) {
                return <TierLockCard key={load.id} load={load} />;
              }
              return (
                <Card key={load.id} className="shadow-sm border-0 overflow-hidden">
                  <CardContent className="p-0">
                    {tier !== "genel" && (
                      <div className={`bg-gradient-to-r ${TIER_COLOR[tier] ?? "from-blue-500 to-blue-600"} px-3 py-1 flex items-center gap-1`}>
                        <Star className="w-3 h-3 text-white fill-white" />
                        <span className="text-[11px] text-white font-semibold">{TIER_LABEL[tier] ?? tier}</span>
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
                        {load.weight != null && (
                          <div className="flex items-center gap-1"><Weight className="w-3.5 h-3.5" />{load.weight} ton</div>
                        )}
                        <div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />{load.vehicleType}</div>
                        {load.distance != null && (
                          <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{load.distance} km</div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {load.pricingModel === "bidding" ? (
                            <span className="text-blue-600 font-semibold text-sm">Açık Teklif</span>
                          ) : (
                            <span className="text-green-600 font-bold text-base">{load.price?.toLocaleString("tr-TR")} ₺</span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(load.createdAt).toLocaleDateString("tr-TR")}
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
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!offerLoad} onOpenChange={open => !open && setOfferLoad(null)}>
        {offerLoad && <OfferDialog load={offerLoad} onClose={() => setOfferLoad(null)} />}
      </Dialog>
    </div>
  );
}
