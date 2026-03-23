import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search, UserPlus, Mail, Phone, MoreHorizontal, Crown,
  ShieldCheck, User, Package, Calendar, CheckCircle2, Clock,
} from "lucide-react";

const TEAM_MEMBERS = [
  {
    id:"1", name:"Ahmet Yıldız",    email:"ahmet.yildiz@borusan.com",    phone:"+90 532 111 22 33",
    role:"admin",   department:"Yönetim",     position:"Lojistik Müdürü",
    status:"active", joinedAt:"Ocak 2023",   activeLoads:5, completedLoads:128,
    avatar:"",
  },
  {
    id:"2", name:"Zeynep Kaya",     email:"zeynep.kaya@borusan.com",      phone:"+90 533 222 33 44",
    role:"manager", department:"Operasyon",   position:"Operasyon Uzmanı",
    status:"active", joinedAt:"Mart 2023",   activeLoads:8, completedLoads:96,
    avatar:"",
  },
  {
    id:"3", name:"Emre Türk",       email:"emre.turk@borusan.com",        phone:"+90 534 333 44 55",
    role:"member",  department:"Satın Alma",  position:"Tedarik Uzmanı",
    status:"active", joinedAt:"Haziran 2023",activeLoads:3, completedLoads:54,
    avatar:"",
  },
  {
    id:"4", name:"Selin Çetin",     email:"selin.cetin@borusan.com",      phone:"+90 535 444 55 66",
    role:"member",  department:"Finans",      position:"Mali İşler Sorumlusu",
    status:"active", joinedAt:"Ağustos 2023",activeLoads:0, completedLoads:42,
    avatar:"",
  },
  {
    id:"5", name:"Burak Şahin",     email:"burak.sahin@borusan.com",      phone:"+90 536 555 66 77",
    role:"member",  department:"Müşteri Hizmetleri","position":"Müşteri Temsilcisi",
    status:"inactive", joinedAt:"Ekim 2023", activeLoads:0, completedLoads:31,
    avatar:"",
  },
];

const ROLE_CONFIG = {
  admin:   { label:"Yönetici",  icon: <Crown className="w-3.5 h-3.5" />,      color:"bg-purple-100 text-purple-700" },
  manager: { label:"Müdür",     icon: <ShieldCheck className="w-3.5 h-3.5" />, color:"bg-blue-100 text-blue-700" },
  member:  { label:"Üye",       icon: <User className="w-3.5 h-3.5" />,        color:"bg-gray-100 text-gray-700" },
};

const DEPARTMENTS = ["Tümü", "Yönetim", "Operasyon", "Satın Alma", "Finans", "Müşteri Hizmetleri"];

export default function CorporateTeam() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("Tümü");

  const filtered = TEAM_MEMBERS.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.position.toLowerCase().includes(q);
    const matchDept = dept === "Tümü" || m.department === dept;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Ekibim</h1>
          <p className="text-muted-foreground mt-1">Şirket hesabını kullanan çalışanlar</p>
        </div>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" /> Üye Davet Et
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Toplam Üye",    value: TEAM_MEMBERS.length,                               color:"text-blue-700",   bg:"bg-blue-50" },
          { label:"Aktif",         value: TEAM_MEMBERS.filter(m=>m.status==="active").length, color:"text-green-700",  bg:"bg-green-50" },
          { label:"Aktif İlan",    value: TEAM_MEMBERS.reduce((a,m)=>a+m.activeLoads,0),     color:"text-orange-700", bg:"bg-orange-50" },
          { label:"Tamamlanan",    value: TEAM_MEMBERS.reduce((a,m)=>a+m.completedLoads,0),  color:"text-purple-700", bg:"bg-purple-50" },
        ].map(s => (
          <Card key={s.label} className={`border-0 shadow-sm ${s.bg}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Çalışan, e-posta veya pozisyon ara..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {DEPARTMENTS.map(d => (
            <Button key={d} size="sm" variant={dept===d?"default":"outline"} onClick={()=>setDept(d)}>{d}</Button>
          ))}
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(member => {
          const roleCfg = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.member;
          return (
            <Card key={member.id} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 border-2 border-border">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {member.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate">{member.name}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.position}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={`gap-1 text-xs border-0 ${roleCfg.color}`}>
                        {roleCfg.icon}{roleCfg.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{member.department}</Badge>
                      <Badge
                        variant={member.status==="active"?"default":"secondary"}
                        className={`text-xs ${member.status==="active"?"bg-green-100 text-green-700 border-green-200":""}`}
                      >
                        {member.status==="active" ? <><CheckCircle2 className="w-3 h-3 mr-1" />Aktif</> : <><Clock className="w-3 h-3 mr-1" />Pasif</>}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1">
                      <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Mail className="w-3.5 h-3.5" />{member.email}
                      </a>
                      <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Phone className="w-3.5 h-3.5" />{member.phone}
                      </a>
                    </div>

                    <div className="mt-3 flex gap-4 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Package className="w-3.5 h-3.5" />
                        <span className="font-semibold text-foreground">{member.activeLoads}</span> aktif ilan
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {member.joinedAt}'dan beri
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
