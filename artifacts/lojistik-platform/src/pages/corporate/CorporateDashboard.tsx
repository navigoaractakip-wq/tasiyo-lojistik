import { useListLoads, useListOffers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Package, MessageSquare, TrendingUp, AlertCircle, Truck } from "lucide-react";
import { LoadCard } from "@/components/ui/LoadCard";

export default function CorporateDashboard() {
  const { data: loadsData } = useListLoads({ status: "active" });
  const { data: offersData } = useListOffers({ status: "pending" });

  // Mock data fallbacks
  const mockLoads = loadsData?.loads || [
    {
      id: "1", title: "İstanbul - Ankara Parsiyel Yük", origin: "İstanbul, Tuzla", destination: "Ankara, Ostim",
      weight: 4.5, loadType: "Parsiyel", vehicleType: "Kamyon", pricingModel: "bidding",
      status: "active", createdAt: new Date().toISOString(), isPremium: true, offersCount: 3
    },
    {
      id: "2", title: "İzmir - Bursa Konteyner", origin: "İzmir, Aliağa", destination: "Bursa, Gemlik",
      weight: 24, loadType: "Konteyner", vehicleType: "TIR", pricingModel: "fixed", price: 18500,
      status: "active", createdAt: new Date().toISOString()
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-primary text-primary-foreground p-8 rounded-3xl relative overflow-hidden shadow-lg shadow-primary/20">
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform translate-x-1/4 scale-150">
            <path fill="currentColor" d="M42.7,-73.4C56.2,-67.9,68.6,-57.4,78.2,-44.3C87.8,-31.2,94.6,-15.6,93.9,-0.4C93.2,14.8,85,29.6,75.2,42.4C65.4,55.2,54,66,40.6,71.7C27.2,77.4,11.8,78,-3.8,75.1C-19.4,72.2,-34.8,65.8,-48.6,56.7C-62.4,47.6,-74.6,35.8,-82.1,21.1C-89.6,6.4,-92.4,-11.2,-87.3,-26.8C-82.2,-42.4,-69.3,-56,-54.6,-62.5C-39.9,-69,-23.4,-68.4,-8.1,-63.9C7.2,-59.4,29.2,-78.9,42.7,-73.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-display tracking-tight mb-2">Hoş Geldiniz, Borusan Lojistik</h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl">
            Bugün platformda işlerinizi kolaylaştırmak için her şey hazır. Yeni bir ilan vererek başlayabilirsiniz.
          </p>
        </div>
        
        <Link href="/dashboard/create-load">
          <Button size="lg" className="relative z-10 bg-accent hover:bg-accent/90 text-white rounded-xl shadow-xl shadow-accent/30 font-semibold px-8 h-14 text-lg">
            <Plus className="mr-2 h-6 w-6" />
            Yeni İlan Ver
          </Button>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Aktif İlanlarım" value="12" icon={Package} trend="+2 bu hafta" />
        <StatCard title="Bekleyen Teklifler" value="28" icon={MessageSquare} trend="5 yeni teklif" alert />
        <StatCard title="Yoldaki Araçlar" value="5" icon={Truck} trend="Tümü zamanında" />
        <StatCard title="Aylık Harcama" value="₺145K" icon={TrendingUp} trend="%12 tasarruf" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Loads */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-foreground">Aktif İlanlarınız</h2>
            <Button variant="ghost" className="text-primary font-medium">Tümünü Gör</Button>
          </div>
          
          <div className="grid gap-4">
            {mockLoads.map((load: any) => (
              <LoadCard key={load.id} load={load} viewMode="corporate" />
            ))}
          </div>
        </div>

        {/* Recent Offers Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-foreground">Son Teklifler</h2>
          </div>
          
          <Card className="border-border/50 shadow-sm bg-white">
            <CardContent className="p-0 divide-y divide-border/50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">Ahmet Yılmaz</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Truck className="h-3 w-3" /> TIR - Tenteli
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary leading-none">₺18.000</p>
                      <p className="text-[10px] text-muted-foreground mt-1">2 saat önce</p>
                    </div>
                  </div>
                  <div className="text-xs bg-slate-100 p-2 rounded-md truncate text-slate-600">
                    İlgili ilan: İstanbul - Ankara Parsiyel...
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white h-8 text-xs">Kabul Et</Button>
                    <Button size="sm" variant="outline" className="flex-1 rounded-lg border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs">Reddet</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, alert }: any) {
  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`p-3 rounded-2xl ${alert ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold font-display text-foreground mt-1">{value}</h3>
          <p className={`text-xs mt-1 font-medium ${alert ? 'text-accent flex items-center gap-1' : 'text-green-600'}`}>
            {alert && <AlertCircle className="h-3 w-3" />}
            {trend}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
