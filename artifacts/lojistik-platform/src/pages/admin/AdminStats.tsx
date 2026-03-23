import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Package, Truck, DollarSign,
  ArrowUpRight, ArrowDownRight, Calendar,
} from "lucide-react";

const revenueData = [
  { ay: "Eki", gelir: 320000, gider: 120000 },
  { ay: "Kas", gelir: 410000, gider: 140000 },
  { ay: "Ara", gelir: 380000, gider: 130000 },
  { ay: "Oca", gelir: 450000, gider: 160000 },
  { ay: "Şub", gelir: 490000, gider: 170000 },
  { ay: "Mar", gelir: 540000, gider: 185000 },
];

const loadTypeData = [
  { name: "Parsiyel", value: 35, color: "#3b82f6" },
  { name: "Komple",   value: 28, color: "#10b981" },
  { name: "Konteyner",value: 20, color: "#f59e0b" },
  { name: "Dökme",    value: 10, color: "#8b5cf6" },
  { name: "Soğuk",    value: 7,  color: "#ef4444" },
];

const dailyLoads = [
  { gun: "Pzt", ilanlar: 45, tamamlanan: 38 },
  { gun: "Sal", ilanlar: 58, tamamlanan: 50 },
  { gun: "Çar", ilanlar: 42, tamamlanan: 36 },
  { gun: "Per", ilanlar: 70, tamamlanan: 62 },
  { gun: "Cum", ilanlar: 65, tamamlanan: 55 },
  { gun: "Cmt", ilanlar: 30, tamamlanan: 22 },
  { gun: "Paz", ilanlar: 18, tamamlanan: 14 },
];

const cityData = [
  { sehir: "İstanbul", ilanlar: 340 },
  { sehir: "Ankara",   ilanlar: 210 },
  { sehir: "İzmir",    ilanlar: 175 },
  { sehir: "Bursa",    ilanlar: 120 },
  { sehir: "Antalya",  ilanlar: 95 },
  { sehir: "Gaziantep",ilanlar: 80 },
];

const topDrivers = [
  { name: "Mehmet Yılmaz",  sefer: 42, puan: 4.9, gelir: 126000 },
  { name: "Ali Demir",      sefer: 38, puan: 4.8, gelir: 114000 },
  { name: "Hasan Çelik",   sefer: 35, puan: 4.7, gelir: 105000 },
  { name: "Fatih Kaya",    sefer: 31, puan: 4.9, gelir: 93000 },
  { name: "İbrahim Şahin", sefer: 28, puan: 4.6, gelir: 84000 },
];

function StatCard({ title, value, change, icon: Icon, color }: { title: string; value: string; change: number; icon: React.ElementType; color: string }) {
  const positive = change >= 0;
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>
              {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(change)}% geçen aya göre
            </div>
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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">Raporlar & Analitik</h1>
        <p className="text-muted-foreground mt-1">Platform performansı ve iş metrikleri</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Toplam Gelir"   value="540.000 ₺" change={10.2} icon={DollarSign} color="bg-blue-50 text-blue-600" />
        <StatCard title="Aktif Şoförler" value="342"        change={5.8}  icon={Truck}      color="bg-green-50 text-green-600" />
        <StatCard title="Yeni İlanlar"   value="128"        change={-3.1} icon={Package}    color="bg-orange-50 text-orange-600" />
        <StatCard title="Yeni Üyeler"    value="64"         change={12.4} icon={Users}      color="bg-purple-50 text-purple-600" />
      </div>

      {/* Revenue Chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Gelir & Gider (Son 6 Ay)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gelir" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gider" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString("tr-TR")} ₺`} />
              <Legend />
              <Area type="monotone" dataKey="gelir" name="Gelir" stroke="#3b82f6" fill="url(#gelir)" strokeWidth={2} />
              <Area type="monotone" dataKey="gider" name="Gider" stroke="#ef4444" fill="url(#gider)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Row: Daily + Pie */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Günlük İlan & Tamamlanma</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyLoads} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="gun" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ilanlar"    name="İlanlar"     fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar dataKey="tamamlanan" name="Tamamlanan"  fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Yük Türü Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={loadTypeData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${value}%`} labelLine={false}>
                  {loadTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1 w-full">
              {loadTypeData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span>{d.name}</span>
                  </div>
                  <span className="font-medium">{d.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: City + Top Drivers */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Şehre Göre İlan Sayısı</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cityData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="sehir" tick={{ fontSize: 12 }} width={72} />
                <Tooltip />
                <Bar dataKey="ilanlar" name="İlanlar" fill="#8b5cf6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">En Aktif Şoförler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDrivers.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${i===0?"bg-yellow-400":i===1?"bg-gray-400":i===2?"bg-orange-400":"bg-blue-200 text-blue-800"}`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.sefer} sefer · ⭐ {d.puan}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{d.gelir.toLocaleString("tr-TR")} ₺</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
