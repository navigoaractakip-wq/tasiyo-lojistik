import { useListLoads } from "@workspace/api-client-react";
import { LoadCard } from "@/components/ui/LoadCard";
import { Search, Map, Filter, BellRing } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DriverFeed() {
  const { data, isLoading } = useListLoads({ status: "active" });

  const mockLoads = data?.loads || [
    {
      id: "1", title: "İstanbul - Ankara Parsiyel Yük", origin: "İstanbul, Tuzla", destination: "Ankara, Ostim",
      weight: 4.5, loadType: "Parsiyel", vehicleType: "TIR", pricingModel: "fixed", price: 15000,
      status: "active", createdAt: new Date().toISOString(), isPremium: true
    },
    {
      id: "2", title: "İzmir - Bursa Konteyner", origin: "İzmir, Liman", destination: "Bursa, OSB",
      weight: 24, loadType: "Konteyner", vehicleType: "Açık Kasa", pricingModel: "bidding",
      status: "active", createdAt: new Date().toISOString()
    },
    {
      id: "3", title: "Kocaeli - Antalya Tekstil", origin: "Kocaeli, Gebze", destination: "Antalya, Merkez",
      weight: 12, loadType: "Genel Kargo", vehicleType: "Kapalı Kasa", pricingModel: "fixed", price: 18500,
      status: "active", createdAt: new Date().toISOString()
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Search Header */}
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-bold font-display text-white mb-4">Sana Uygun Yükler</h1>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              className="pl-10 h-12 rounded-xl border-0 shadow-inner bg-white/95 text-gray-900 placeholder:text-gray-500" 
              placeholder="Rota veya şehir ara..." 
            />
          </div>
          <Button size="icon" className="h-12 w-12 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/10">
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Smart Alerts */}
      <div className="px-4 -mt-4 relative z-10 mb-6">
        <div className="bg-accent text-white rounded-xl p-3 shadow-lg shadow-accent/20 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <BellRing className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Yakınında 3 yeni yük var!</p>
            <p className="text-xs text-white/80">Tuzla bölgesinden çıkışlı</p>
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-800">Önerilen İlanlar</h2>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">Yeni: 12</span>
        </div>
        
        {mockLoads.map((load: any) => (
          <LoadCard 
            key={load.id} 
            load={load} 
            viewMode="driver" 
            onAction={(load) => alert(`Teklif verme ekranı açılıyor: ${load.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
