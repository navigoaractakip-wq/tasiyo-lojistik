import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, ArrowRight, Calendar, Weight, Info, Pencil, Trash2 } from "lucide-react";
import type { Load } from "@workspace/api-client-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Link } from "wouter";

interface WaypointDef { type: "pickup" | "delivery"; name: string; }
function parseWaypoints(s?: string): WaypointDef[] {
  if (!s) return [];
  try { return JSON.parse(s); } catch { return []; }
}

interface LoadCardProps {
  load: Load;
  viewMode?: "corporate" | "driver" | "admin";
  onAction?: (load: Load) => void;
  onDelete?: (load: Load) => void;
}

export function LoadCard({ load, viewMode = "corporate", onAction, onDelete }: LoadCardProps) {
  // Load can be deleted only when no accepted offer exists (status != assigned/completed)
  const isDeletable = onDelete && !["assigned", "completed", "cancelled"].includes(load.status);
  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "assigned": return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case "active": return "Aktif İlan";
      case "pending": return "Teklif Bekliyor";
      case "assigned": return "Araca Atandı";
      case "completed": return "Tamamlandı";
      case "cancelled": return "İptal Edildi";
      default: return status;
    }
  };

  return (
    <Card className="overflow-hidden card-hover-effect border-border/60">
      <CardContent className="p-0">
        {/* Header/Route */}
        <div className="p-5 border-b border-border/50 bg-slate-50/50">
          <div className="flex justify-between items-start mb-4">
            <Badge variant="outline" className={`font-semibold px-2.5 py-0.5 ${getStatusColor(load.status)}`}>
              {getStatusText(load.status)}
            </Badge>
            {load.isPremium && (
              <Badge className="bg-gradient-to-r from-accent to-orange-400 text-white border-0 shadow-sm">
                Öne Çıkan
              </Badge>
            )}
          </div>
          
          {(() => {
            const wps = parseWaypoints((load as any).waypoints);
            const pickupWps = wps.filter(w => w.type === "pickup");
            const deliveryWps = wps.filter(w => w.type === "delivery");
            const allStops = [
              { label: "Yükleme", name: load.origin, color: "bg-primary ring-primary/20", isFirst: true, isLast: false },
              ...pickupWps.map((w, i) => ({ label: `Yükleme ${i + 2}`, name: w.name, color: "bg-blue-400 ring-blue-200", isFirst: false, isLast: false })),
              ...deliveryWps.map((w, i) => ({ label: `Ara Teslim ${i + 1}`, name: w.name, color: "bg-orange-400 ring-orange-200", isFirst: false, isLast: false })),
              { label: "Teslimat", name: load.destination, color: "bg-accent ring-accent/20", isFirst: false, isLast: true },
            ];
            return (
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  {allStops.map((stop, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ring-4 ${stop.isLast ? "" : ""} ${
                        stop.isFirst ? "bg-primary ring-primary/20" :
                        stop.isLast ? "bg-accent ring-accent/20" :
                        "bg-blue-400 ring-blue-200"
                      }`} />
                      {i < allStops.length - 1 && (
                        <div className="w-0.5 h-6 bg-gray-200" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex-1 space-y-1">
                  {allStops.map((stop, i) => (
                    <div key={i} className={i < allStops.length - 1 ? "pb-1" : ""}>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stop.label}</p>
                      <p className="font-bold text-foreground text-sm leading-tight">{stop.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Details Grid */}
        <div className="p-5 grid grid-cols-2 gap-4 bg-white">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Araç / Yük Tipi</p>
              <p className="text-sm font-semibold">{load.vehicleType}</p>
              <p className="text-xs text-gray-500">{load.loadType}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <Weight className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ağırlık</p>
              <p className="text-sm font-semibold">{load.weight} Ton</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 col-span-2">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Yükleme Tarihi</p>
                <p className="text-sm font-semibold">
                  {load.pickupDate ? format(new Date(load.pickupDate), "d MMM yyyy", { locale: tr }) : "Hemen"}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Teslim Tarihi</p>
                <p className="text-sm font-semibold">
                  {load.deliveryDate ? format(new Date(load.deliveryDate), "d MMM yyyy", { locale: tr }) : "Belirtilmedi"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Actions */}
        <div className="p-5 pt-0 flex items-center justify-between bg-white rounded-b-xl">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">
              {load.pricingModel === "fixed" ? "Sabit Fiyat" : "Hedef Fiyat"}
            </p>
            <p className="text-xl font-display font-bold text-primary">
              {load.price ? `₺${load.price.toLocaleString("tr-TR")}` : "Teklif Usulü"}
            </p>
          </div>
          
          {viewMode === "corporate" && (
            <div className="flex items-center gap-2">
              {isDeletable && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5 h-9 px-3"
                  onClick={() => onDelete!(load)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Sil
                </Button>
              )}
              {(load.offersCount ?? 0) === 0 && (
                <Link href={`/dashboard/edit-load/${load.id}`}>
                  <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-primary gap-1.5 h-9 px-3">
                    <Pencil className="w-3.5 h-3.5" /> Düzenle
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/5">
                Detaylar ({load.offersCount || 0} Teklif)
              </Button>
            </div>
          )}
          
          {viewMode === "driver" && (
            <Button 
              onClick={() => onAction && onAction(load)}
              className="rounded-xl bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/30 px-6"
            >
              Teklif Ver
            </Button>
          )}
          
          {viewMode === "admin" && (
            <Button variant="secondary" size="icon" className="rounded-xl">
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
