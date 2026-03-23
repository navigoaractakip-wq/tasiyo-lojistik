import { useState } from "react";
import { useListLoads } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Package, Search, MapPin, Weight, Calendar, Eye, Trash2, Star,
  Filter, TrendingUp, CheckCircle2, Clock, XCircle,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default"|"secondary"|"destructive"|"outline"; icon: React.ReactNode }> = {
  active:     { label: "Aktif",     variant: "default",     icon: <TrendingUp className="w-3 h-3" /> },
  pending:    { label: "Bekliyor",  variant: "secondary",   icon: <Clock className="w-3 h-3" /> },
  completed:  { label: "Tamamlandı",variant: "outline",     icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled:  { label: "İptal",    variant: "destructive",  icon: <XCircle className="w-3 h-3" /> },
};

const MOCK_LOADS = [
  { id:"1", title:"İstanbul - Ankara Parsiyel", origin:"İstanbul, Tuzla", destination:"Ankara, Ostim", weight:4.5, loadType:"Parsiyel", vehicleType:"TIR", price:15000, pricingModel:"fixed", status:"active", isPremium:true, offersCount:3, createdAt:"2026-03-20" },
  { id:"2", title:"İzmir - Bursa Konteyner",    origin:"İzmir, Liman",   destination:"Bursa, OSB",   weight:24,  loadType:"Konteyner", vehicleType:"Açık Kasa", price:22000, pricingModel:"fixed", status:"active", isPremium:false, offersCount:1, createdAt:"2026-03-21" },
  { id:"3", title:"Kocaeli - Antalya Tekstil",  origin:"Kocaeli, Gebze", destination:"Antalya, Merkez", weight:12, loadType:"Genel Kargo", vehicleType:"Kapalı Kasa", price:18500, pricingModel:"bidding", status:"active", isPremium:true, offersCount:5, createdAt:"2026-03-22" },
  { id:"4", title:"Bursa - İstanbul Otomotiv",  origin:"Bursa, OSB",     destination:"İstanbul, Tuzla", weight:8, loadType:"Ağır Yük", vehicleType:"Lowbed", price:28000, pricingModel:"fixed", status:"completed", isPremium:false, offersCount:2, createdAt:"2026-03-18" },
  { id:"5", title:"Gaziantep - Mersin İhracat", origin:"Gaziantep Merkez", destination:"Mersin Liman", weight:20, loadType:"Dökme", vehicleType:"Tenteli TIR", price:21000, pricingModel:"bidding", status:"pending", isPremium:true, offersCount:0, createdAt:"2026-03-23" },
  { id:"6", title:"Adana - Konya Gıda",         origin:"Adana, Seyhan",  destination:"Konya Merkez", weight:6, loadType:"Soğuk Zincir", vehicleType:"Frigorifik", price:12000, pricingModel:"fixed", status:"active", isPremium:false, offersCount:4, createdAt:"2026-03-19" },
  { id:"7", title:"Eskişehir - Kayseri Makine", origin:"Eskişehir OSB",  destination:"Kayseri OSB", weight:15, loadType:"Proje Kargo", vehicleType:"Lowbed", price:35000, pricingModel:"bidding", status:"cancelled", isPremium:false, offersCount:0, createdAt:"2026-03-15" },
  { id:"8", title:"Samsun - İzmir Tahıl",       origin:"Samsun Liman",   destination:"İzmir Alsancak", weight:40, loadType:"Dökme", vehicleType:"TIR", price:18000, pricingModel:"fixed", status:"active", isPremium:true, offersCount:6, createdAt:"2026-03-22" },
];

export default function AdminLoads() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { data } = useListLoads({});
  const loads = (data?.loads?.length ? data.loads : MOCK_LOADS) as typeof MOCK_LOADS;

  const filtered = loads.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.origin.toLowerCase().includes(search.toLowerCase()) ||
      l.destination.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = { all: loads.length, active: loads.filter(l=>l.status==="active").length, pending: loads.filter(l=>l.status==="pending").length, completed: loads.filter(l=>l.status==="completed").length, cancelled: loads.filter(l=>l.status==="cancelled").length };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">İlan Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Platformdaki tüm yük ilanlarını görüntüleyin ve yönetin</p>
        </div>
        <Button className="gap-2"><Package className="w-4 h-4" /> Yeni İlan</Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Toplam İlan",   value: counts.all,       color:"text-gray-700",  bg:"bg-gray-50" },
          { label:"Aktif",         value: counts.active,    color:"text-green-700", bg:"bg-green-50" },
          { label:"Bekleyen",      value: counts.pending,   color:"text-yellow-700",bg:"bg-yellow-50" },
          { label:"Tamamlanan",    value: counts.completed, color:"text-blue-700",  bg:"bg-blue-50" },
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
          {[{key:"all",label:"Tümü"},{key:"active",label:"Aktif"},{key:"pending",label:"Bekleyen"},{key:"completed",label:"Tamamlanan"},{key:"cancelled",label:"İptal"}].map(f => (
            <Button
              key={f.key}
              variant={filterStatus===f.key ? "default" : "outline"}
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
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{load.createdAt?.split("T")[0]}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
