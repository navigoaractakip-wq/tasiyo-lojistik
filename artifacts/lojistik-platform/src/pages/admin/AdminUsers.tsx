import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListUsers, useUpdateUser, ListUsersRole, getListUsersQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search, MoreHorizontal, CheckCircle2, Ban, Loader2, Users, Trash2, UserCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminUsers() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<ListUsersRole | "all">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useListUsers({
    role: roleFilter !== "all" ? (roleFilter as ListUsersRole) : undefined,
  });

  const { mutate: updateUser } = useUpdateUser({
    mutation: {
      onSuccess: () => {
        setLoadingId(null);
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "Kullanıcı güncellendi", description: "Durum başarıyla değiştirildi." });
      },
      onError: () => {
        setLoadingId(null);
        toast({ title: "Hata", description: "İşlem gerçekleştirilemedi.", variant: "destructive" });
      },
    },
  });

  const handleStatusChange = (userId: string, newStatus: "active" | "suspended") => {
    setLoadingId(userId);
    updateUser({ id: userId, data: { status: newStatus } });
  };

  const handleDelete = async (userId: string) => {
    setLoadingId(userId);
    try {
      const base = import.meta.env.BASE_URL ?? "/";
      const res = await fetch(`${base}api/users/${userId}`.replace(/\/+/g, "/").replace(":/", "://"), {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Silinemedi");
      }
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "Kullanıcı silindi" });
    } catch (e: any) {
      toast({ title: "Hata", description: e.message ?? "Silme başarısız.", variant: "destructive" });
    } finally {
      setLoadingId(null);
      setConfirmDeleteId(null);
    }
  };

  const users = data?.users ?? [];
  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.company ?? "").toLowerCase().includes(q)
    );
  });

  const ROLE_FILTERS = [
    { value: "all",       label: "Tümü" },
    { value: "corporate", label: "Kurumsal" },
    { value: "driver",    label: "Şoför" },
    { value: "admin",     label: "Yönetici" },
  ];

  const roleLabel = (role: string) => {
    if (role === "corporate") return "Kurumsal";
    if (role === "driver")    return "Şoför";
    if (role === "admin")     return "Yönetici";
    return "Bireysel";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">Platformdaki tüm kullanıcıları ve şirketleri yönetin</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="p-4 border-b border-border/50 bg-slate-50/50 flex flex-row items-center justify-between gap-3 flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 rounded-xl bg-white border-border"
              placeholder="İsim, e-posta veya firma ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {ROLE_FILTERS.map(f => (
              <Button
                key={f.value}
                size="sm"
                variant={roleFilter === f.value ? "default" : "outline"}
                className="rounded-xl"
                onClick={() => setRoleFilter(f.value as ListUsersRole | "all")}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Users className="w-8 h-8" />
              <p className="text-sm">Kullanıcı bulunamadı</p>
            </div>
          ) : (
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
                {filtered.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={(user as any).avatarUrl ?? ""} alt={user.name} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          {user.company && (
                            <p className="text-xs text-muted-foreground">{user.company}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white">
                        {roleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`
                          ${user.status === "active"    ? "bg-green-100 text-green-700"  : ""}
                          ${user.status === "pending"   ? "bg-amber-100 text-amber-700"  : ""}
                          ${user.status === "suspended" ? "bg-red-100   text-red-700"    : ""}
                        `}
                      >
                        {user.status === "active"    ? "Aktif"
                          : user.status === "pending" ? "Onay Bekliyor"
                          : "Askıya Alındı"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {loadingId === user.id ? (
                        <div className="flex justify-end pr-2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {user.status === "pending" && (
                              <DropdownMenuItem
                                className="text-green-600 focus:text-green-600 gap-2"
                                onClick={() => handleStatusChange(user.id, "active")}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Onayla
                              </DropdownMenuItem>
                            )}
                            {user.status === "active" && user.role !== "admin" && (
                              <DropdownMenuItem
                                className="text-orange-600 focus:text-orange-600 gap-2"
                                onClick={() => handleStatusChange(user.id, "suspended")}
                              >
                                <Ban className="h-4 w-4" />
                                Askıya Al
                              </DropdownMenuItem>
                            )}
                            {user.status === "suspended" && (
                              <DropdownMenuItem
                                className="text-green-600 focus:text-green-600 gap-2"
                                onClick={() => handleStatusChange(user.id, "active")}
                              >
                                <UserCheck className="h-4 w-4" />
                                Yeniden Aktifleştir
                              </DropdownMenuItem>
                            )}
                            {user.role !== "admin" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive gap-2"
                                  onClick={() => setConfirmDeleteId(user.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Kullanıcıyı Sil
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={open => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
