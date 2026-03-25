import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListLoads, useUpdateLoad, getListLoadsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Package, Search, MapPin, Calendar, EyeOff, Eye, Trash2, Star,
  TrendingUp, CheckCircle2, Clock, XCircle, Loader2,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default"|"secondary"|"destructive"|"outline"; icon: React.ReactNode }> = {
  active:     { label: "Aktif",      variant: "default",     icon: <TrendingUp className="w-3 h-3" /> },
  pending:    { label: "Bekliyor",   variant: "secondary",   icon: <Clock className="w-3 h-3" /> },
  completed:  { label: "Tamamlandı", variant: "outline",     icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled:  { label: "İptal",      variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

export default function AdminLoads() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading } = useListLoads({});
  const loads = data?.loads ?? [];

  const { mutate: updateLoad } = useUpdateLoad({
    mutation: {
      onSuccess: () => {
        setTogglingId(null);
        queryClient.invalidateQueries({ queryKey: getListLoadsQueryKey() });
        toast({ title: "İlan güncellendi" });
      },
      onError: () => {
        setTogglingId(null);
        toast({ title: "Hata", description: "Durum değiştirilemedi.", variant: "destructive" });
      },
    },
  });

  const handleToggleVisibility = (load: typeof loads[number]) => {
    setTogglingId(load.id);
    const newStatus = load.status === "active" ? "cancelled" : "active";
    updateLoad({ id: load.id, data: { status: newStatus } });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/loads/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Silinemedi");
      }
      queryClient.invalidateQueries({ queryKey: getListLoadsQueryKey() });
      toast({ title: "İlan silindi" });
    } catch (e: any) {
      toast({ title: "Hata", description: e.message ?? "Silme başarısız.", variant: "destructive" });
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const filtered = loads.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.origin.toLowerCase().includes(search.toLowerCase()) ||
      l.destination.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:       loads.length,
    active:    loads.filter(l => l.status === "active").length,
    pending:   loads.filter(l => l.status === "pending").length,
    completed: loads.filter(l => l.status === "completed").length,
    cancelled: loads.filter(l => l.status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">İlan Yönetimi</h1>
        <p className="text-muted-foreground mt-1">Platformdaki tüm yük ilanlarını görüntüleyin ve yönetin</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam İlan",  value: counts.all,       color: "text-gray-700",   bg: "bg-gray-50" },
          { label: "Aktif",        value: counts.active,    color: "text-green-700",  bg: "bg-green-50" },
          { label: "Bekleyen",     value: counts.pending,   color: "text-yellow-700", bg: "bg-yellow-50" },
          { label: "Tamamlanan",   value: counts.completed, color: "text-blue-700",   bg: "bg-blue-50" },
        ].map(s => (
          <Card key={s.label} className={`border-0 shadow-sm ${s.bg}`}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
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
            placeholder="İlan, şehir veya rota ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "Tümü" },
            { key: "active", label: "Aktif" },
            { key: "pending", label: "Bekleyen" },
            { key: "completed", label: "Tamamlanan" },
            { key: "cancelled", label: "İptal" },
          ].map(f => (
            <Button
              key={f.key}
              variant={filterStatus === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Package className="w-8 h-8" />
              <p className="text-sm">İlan bulunamadı</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>İlan</TableHead>
                  <TableHead>Güzergah</TableHead>
                  <TableHead>Ağırlık</TableHead>
                  <TableHead>Teklif</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(load => {
                  const st = STATUS_MAP[load.status] ?? STATUS_MAP.active;
                  const isToggling = togglingId === load.id;
                  const isDeleting = deletingId === load.id;
                  const isActive = load.status === "active";

                  return (
                    <TableRow key={load.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {load.isPremium && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />}
                          <div>
                            <p className="font-medium text-sm">{load.title}</p>
                            <p className="text-xs text-muted-foreground">{load.loadType} · {load.vehicleType}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-green-500" />{load.origin}</div>
                          <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500" />{load.destination}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{load.weight} t</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{load.offersCount ?? 0} teklif</Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {load.pricingModel === "bidding" ? (
                          <span className="text-blue-600">Açık Artırma</span>
                        ) : (
                          <span>{(load.price ?? 0).toLocaleString("tr-TR")} ₺</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant} className="gap-1 text-xs">
                          {st.icon}{st.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {load.createdAt?.split("T")[0]}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${isActive ? "text-muted-foreground" : "text-orange-500"}`}
                            title={isActive ? "Gizle" : "Yayınla"}
                            disabled={isToggling || isDeleting}
                            onClick={() => handleToggleVisibility(load)}
                          >
                            {isToggling ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isActive ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Sil"
                            disabled={isToggling || isDeleting}
                            onClick={() => setConfirmDeleteId(load.id)}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={open => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İlanı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu ilanı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
