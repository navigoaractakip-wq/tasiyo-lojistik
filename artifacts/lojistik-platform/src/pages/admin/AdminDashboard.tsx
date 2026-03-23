import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PackageSearch, Truck, DollarSign } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  // Mock data if API is missing for demo
  const mockStats = {
    totalUsers: 1245,
    activeUsers: 890,
    totalLoads: 450,
    activeLoads: 120,
    totalShipments: 850,
    completedShipments: 810,
    totalRevenue: 2450000,
    monthlyRevenue: 450000,
    pendingApprovals: 15,
    activeVehicles: 340,
    revenueChart: [
      { label: 'Oca', value: 300000 },
      { label: 'Şub', value: 350000 },
      { label: 'Mar', value: 320000 },
      { label: 'Nis', value: 410000 },
      { label: 'May', value: 380000 },
      { label: 'Haz', value: 450000 },
    ],
    shipmentsChart: [
      { label: 'Pzt', value: 45 },
      { label: 'Sal', value: 52 },
      { label: 'Çar', value: 38 },
      { label: 'Per', value: 65 },
      { label: 'Cum', value: 58 },
      { label: 'Cmt', value: 20 },
      { label: 'Paz', value: 15 },
    ]
  };

  const displayStats = stats || mockStats;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Genel Bakış</h1>
          <p className="text-muted-foreground">Platformun genel performans metrikleri</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Toplam Kullanıcı" 
          value={displayStats.totalUsers.toLocaleString('tr-TR')} 
          subValue={`${displayStats.activeUsers} aktif`}
          icon={Users} 
          trend="+12%"
          color="blue"
        />
        <KpiCard 
          title="Aktif İlanlar" 
          value={displayStats.activeLoads.toString()} 
          subValue={`${displayStats.totalLoads} toplam ilan`}
          icon={PackageSearch} 
          trend="+5%"
          color="orange"
        />
        <KpiCard 
          title="Aylık Ciro" 
          value={`₺${displayStats.monthlyRevenue.toLocaleString('tr-TR')}`} 
          subValue={`Toplam: ₺${(displayStats.totalRevenue / 1000000).toFixed(1)}M`}
          icon={DollarSign} 
          trend="+18%"
          color="green"
        />
        <KpiCard 
          title="Yoldaki Araçlar" 
          value={displayStats.activeVehicles.toString()} 
          subValue={`${displayStats.pendingApprovals} onay bekleyen`}
          icon={Truck} 
          trend="-2%"
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Gelir Trendi (Son 6 Ay)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayStats.revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(val) => `₺${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Gelir']}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Shipments Chart */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Haftalık Sevkiyat Sayısı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayStats.shipmentsChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, subValue, icon: Icon, trend, color }: any) {
  const isPositive = trend.startsWith('+');
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-bold font-display text-foreground">{value}</h3>
          </div>
          <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend}
          </span>
          <span className="text-xs text-muted-foreground">{subValue}</span>
        </div>
      </CardContent>
    </Card>
  );
}
