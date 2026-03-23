import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, ArrowRight, Calendar, Weight, Info } from "lucide-react";
import type { Load } from "@workspace/api-client-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface LoadCardProps {
  load: Load;
  viewMode?: "corporate" | "driver" | "admin";
  onAction?: (load: Load) => void;
}

export function LoadCard({ load, viewMode = "corporate", onAction }: LoadCardProps) {
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
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20"></div>
              <div className="w-0.5 h-8 bg-gray-300 dashed"></div>
              <MapPin className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 flex flex-col justify-between h-[68px]">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Yükleme</p>
                <p className="font-bold text-foreground truncate">{load.origin}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Teslimat</p>
                <p className="font-bold text-foreground truncate">{load.destination}</p>
              </div>
            </div>
          </div>
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
            <Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/5">
              Detaylar ({load.offersCount || 0} Teklif)
            </Button>
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
