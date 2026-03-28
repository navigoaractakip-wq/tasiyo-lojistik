import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PackageSearch, Truck, DollarSign, TrendingUp, UserCheck, Building2, Clock } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#3b82f6", "#f97316", "#10b981", "#8b5cf6"];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const pieData = [
    { name: "Şoför", value: stats.driverCount ?? 0 },
    { name: "Kurumsal", value: stats.corporateCount ?? 0 },
    { name: "Bireysel", value: stats.individualCount ?? 0 },
  ].filter((d) => d.value > 0);

  const completionRate = stats.totalShipments > 0
    ? Math.round((stats.completedShipments / stats.totalShipments) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Genel Bakış</h1>
          <p className="text-muted-foreground">Platformun gerçek zamanlı performans metrikleri</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Toplam Kullanıcı"
          value={stats.totalUsers.toLocaleString("tr-TR")}
          subValue={`${stats.activeUsers} aktif`}
          badge={stats.newUsersThisWeek ? `+${stats.newUsersThisWeek} bu hafta` : undefined}
          badgeColor="green"
          icon={Users}
          color="blue"
        />
        <KpiCard
          title="Aktif İlanlar"
          value={stats.activeLoads.toString()}
          subValue={`${stats.totalLoads} toplam ilan`}
          badge={stats.newLoadsThisWeek ? `+${stats.newLoadsThisWeek} bu hafta` : undefined}
          badgeColor="orange"
          icon={PackageSearch}
          color="orange"
        />
        <KpiCard
          title="Aylık Ciro"
          value={`₺${stats.monthlyRevenue.toLocaleString("tr-TR")}`}
          subValue={`Toplam: ₺${(stats.totalRevenue / 1000).toFixed(0)}K`}
          icon={DollarSign}
          color="green"
        />
        <KpiCard
          title="Yoldaki Araçlar"
          value={stats.activeVehicles.toString()}
          subValue={`${stats.pendingApprovals} onay bekleyen`}
          badge={stats.pendingApprovals > 0 ? `${stats.pendingApprovals} bekliyor` : undefined}
          badgeColor="red"
          icon={Truck}
          color="indigo"
        />
      </div>

      {/* İkinci satır KPI'lar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatRow
          icon={TrendingUp}
          label="Tamamlanan Sevkiyat"
          value={`${stats.completedShipments} / ${stats.totalShipments}`}
          detail={`${completionRate}% tamamlanma oranı`}
          color="green"
        />
        <StatRow
          icon={UserCheck}
          label="Aktif Şoförler"
          value={`${stats.driverCount ?? 0}`}
          detail={`${stats.activeVehicles} sevkiyatta`}
          color="blue"
        />
        <StatRow
          icon={Building2}
          label="Kurumsal Üyeler"
          value={`${stats.corporateCount ?? 0}`}
          detail={`${stats.activeLoads} aktif ilanla`}
          color="indigo"
        />
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gelir Trendi */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Gelir Trendi (Son 6 Ay)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.revenueChart.every((d) => d.value === 0) ? (
              <EmptyChart message="Henüz gelir verisi bulunmuyor" />
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(val) => val === 0 ? "₺0" : `₺${(val / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                      formatter={(value: number) => [`₺${value.toLocaleString("tr-TR")}`, "Gelir"]}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sevkiyat Grafiği */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Aylık Sevkiyat Sayısı (Son 6 Ay)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.shipmentsChart.every((d) => d.value === 0) ? (
              <EmptyChart message="Henüz sevkiyat verisi bulunmuyor" />
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.shipmentsChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                      formatter={(value: number) => [value, "Sevkiyat"]}
                    />
                    <Bar dataKey="value" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Kullanıcı Dağılımı */}
      {pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border/50 shadow-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Kullanıcı Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                      formatter={(value: number, name: string) => [value, name]}
                    />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Hızlı İstatistikler */}
          <Card className="border-border/50 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Platform Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <SummaryItem label="Toplam Kullanıcı" value={stats.totalUsers} />
                <SummaryItem label="Aktif Kullanıcı" value={stats.activeUsers} />
                <SummaryItem label="Toplam İlan" value={stats.totalLoads} />
                <SummaryItem label="Aktif İlan" value={stats.activeLoads} />
                <SummaryItem label="Toplam Sevkiyat" value={stats.totalShipments} />
                <SummaryItem label="Tamamlanan" value={stats.completedShipments} />
                <SummaryItem label="Onay Bekleyen" value={stats.pendingApprovals} highlight={stats.pendingApprovals > 0} />
                <SummaryItem label="Toplam Ciro" value={`₺${stats.totalRevenue.toLocaleString("tr-TR")}`} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value, subValue, badge, badgeColor, icon: Icon, color }: {
  title: string; value: string; subValue: string; badge?: string;
  badgeColor?: string; icon: any; color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };
  const badgeMap: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
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
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {badge && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeMap[badgeColor ?? "green"]}`}>
              {badge}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{subValue}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ icon: Icon, label, value, detail, color }: {
  icon: any; label: string; value: string; detail: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-2xl shrink-0 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold font-display text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-red-600" : "text-foreground"}`}>
        {typeof value === "number" ? value.toLocaleString("tr-TR") : value}
      </span>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[280px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <Clock className="w-8 h-8 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
