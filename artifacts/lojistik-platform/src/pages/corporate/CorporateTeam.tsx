import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  UserPlus, Mail, Phone, Crown, Calendar, Info,
} from "lucide-react";

export default function CorporateTeam() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleInvite = () => {
    toast({
      title: "Yakında",
      description: "Ekip daveti özelliği çok yakında kullanıma açılacak.",
    });
  };

  const initials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Ekibim</h1>
          <p className="text-muted-foreground mt-1">Şirket hesabını kullanan çalışanlar</p>
        </div>
        <Button className="gap-2" onClick={handleInvite}>
          <UserPlus className="w-4 h-4" /> Üye Davet Et
        </Button>
      </div>

      {/* Info Banner */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <Info className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <strong>Ekip Yönetimi Yakında:</strong> Çalışanlarınızı davet edip farklı yetki seviyeleriyle
          platforma erişimlerini yönetebileceksiniz. Şu an yalnızca hesap sahibi görünmektedir.
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam Üye",  value: 1,    color: "text-blue-700",   bg: "bg-blue-50"   },
          { label: "Aktif",       value: 1,    color: "text-green-700",  bg: "bg-green-50"  },
          { label: "Bekleyen",    value: 0,    color: "text-orange-700", bg: "bg-orange-50" },
          { label: "Pasif",       value: 0,    color: "text-gray-600",   bg: "bg-gray-50"   },
        ].map(s => (
          <Card key={s.label} className={`border-0 shadow-sm ${s.bg}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current User */}
      {user && (
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 border-2 border-border">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {initials(user.name ?? user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold truncate">{user.name ?? "—"}</p>
                </div>
                <p className="text-sm text-muted-foreground">{user.company ?? "Şirket Sahibi"}</p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className="gap-1 text-xs border-0 bg-purple-100 text-purple-700">
                    <Crown className="w-3.5 h-3.5" /> Hesap Sahibi
                  </Badge>
                  <Badge
                    variant="default"
                    className="text-xs bg-green-100 text-green-700 border-green-200"
                  >
                    Aktif
                  </Badge>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      {user.phone}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-4 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    Hesap sahibi
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
