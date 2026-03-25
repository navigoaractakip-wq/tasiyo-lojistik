import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Users, Package, Truck, DollarSign,
  ArrowUpRight, Loader2, CheckCircle2,
} from "lucide-react";

function StatCard({
  title, value, sub, icon: Icon, color,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && (
              <div className="flex items-center gap-1 mt-2 text-xs font-medium text-green-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {sub}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminStats() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const revenueChartData = (stats?.revenueChart ?? []).map(p => ({
    ay: p.label,
    gelir: p.value,
  }));

  const shipmentsChartData = (stats?.shipmentsChart ?? []).map(p => ({
    ay: p.label,
    sevkiyat: p.value,
  }));

  const loadTypeData = [
    { name: "Aktif İlan",   value: stats?.activeLoads ?? 0,           color: "#3b82f6" },
    { name: "Tamamlanan",   value: stats?.completedShipments ?? 0,    color: "#10b981" },
    { name: "Bekleyen",     value: stats?.pendingApprovals ?? 0,       color: "#f59e0b" },
    { name: "Diğer",        value: Math.max(0, (stats?.totalShipments ?? 0) - (stats?.completedShipments ?? 0)), color: "#8b5cf6" },
  ].filter(d => d.value > 0);

  const pieTotal = loadTypeData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">Raporlar & Analitik</h1>
        <p className="text-muted-foreground mt-1">Platform performansı ve gerçek zamanlı iş metrikleri</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Gelir"
          value={`${((stats?.totalRevenue ?? 0) / 1000).toFixed(0)}K ₺`}
          sub={`Bu ay: ${((stats?.monthlyRevenue ?? 0) / 1000).toFixed(0)}K ₺`}
          icon={DollarSign}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Toplam Kullanıcı"
          value={stats?.totalUsers ?? 0}
          sub={`${stats?.activeUsers ?? 0} aktif`}
          icon={Users}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Toplam İlan"
          value={stats?.totalLoads ?? 0}
          sub={`${stats?.activeLoads ?? 0} aktif ilan`}
          icon={Package}
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          title="Tamamlanan Sevkiyat"
          value={stats?.completedShipments ?? 0}
          sub={`Toplam: ${stats?.totalShipments ?? 0}`}
          icon={CheckCircle2}
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* Revenue Chart */}
      {revenueChartData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Aylık Gelir (₺)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gelirGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("tr-TR")} ₺`} />
                <Area type="monotone" dataKey="gelir" name="Gelir" stroke="#3b82f6" fill="url(#gelirGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Sevkiyat Chart + Pie */}
      <div className="grid md:grid-cols-3 gap-4">
        {shipmentsChartData.length > 0 && (
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Aylık Sevkiyat</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={shipmentsChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sevkiyat" name="Sevkiyat" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {pieTotal > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Platform Dağılımı</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={loadTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    labelLine={false}
                  >
                    {loadTypeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1 w-full">
                {loadTypeData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                    </div>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Aktif Kullanıcı",       value: stats?.activeUsers ?? 0,         icon: Users,       color: "text-blue-600 bg-blue-50" },
          { label: "Aktif İlan",             value: stats?.activeLoads ?? 0,         icon: Package,     color: "text-green-600 bg-green-50" },
          { label: "Onay Bekleyen",          value: stats?.pendingApprovals ?? 0,    icon: TrendingUp,  color: "text-yellow-600 bg-yellow-50" },
          { label: "Aktif Araç (Tahm.)",     value: stats?.activeVehicles ?? 0,      icon: Truck,       color: "text-purple-600 bg-purple-50" },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color.split(" ")[1]}`}>
                <s.icon className={`w-4 h-4 ${s.color.split(" ")[0]}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
