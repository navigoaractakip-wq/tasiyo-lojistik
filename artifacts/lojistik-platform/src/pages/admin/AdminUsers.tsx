import { useListUsers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, CheckCircle2, Ban } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminUsers() {
  const { data, isLoading } = useListUsers();
  
  // Mock data if API is empty
  const mockUsers = data?.users || [
    { id: "1", name: "Borusan Lojistik", email: "info@borusan.com", role: "corporate", status: "active", createdAt: "2023-10-12" },
    { id: "2", name: "Ahmet Yılmaz", email: "ahmet@gmail.com", role: "driver", status: "active", createdAt: "2023-11-05" },
    { id: "3", name: "Netlog Lojistik", email: "contact@netlog.com", role: "corporate", status: "pending", createdAt: "2023-12-01" },
    { id: "4", name: "Mehmet Demir", email: "mehmet.d@gmail.com", role: "driver", status: "suspended", createdAt: "2023-09-20" },
    { id: "5", name: "Ekol Lojistik", email: "info@ekol.com", role: "corporate", status: "active", createdAt: "2023-08-15" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">Platformdaki tüm kullanıcıları ve şirketleri yönetin</p>
        </div>
        <Button className="rounded-xl">Kullanıcı Ekle</Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="p-4 border-b border-border/50 bg-slate-50/50 flex flex-row items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 rounded-xl bg-white border-border" placeholder="İsim, e-posta veya firma ara..." />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl border-border bg-white">Filtrele</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4">Kullanıcı</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-white">
                      {user.role === 'corporate' ? 'Kurumsal' : user.role === 'driver' ? 'Şoför' : 'Yönetici'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`
                      ${user.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                      ${user.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                      ${user.status === 'suspended' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {user.status === 'active' ? 'Aktif' : user.status === 'pending' ? 'Onay Bekliyor' : 'Askıya Alındı'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.status === 'pending' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {user.status === 'active' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
