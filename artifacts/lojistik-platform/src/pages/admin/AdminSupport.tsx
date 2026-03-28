import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  HeadphonesIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Send,
  User,
  Tag,
  Calendar,
} from "lucide-react";

const CATEGORIES: Record<string, string> = {
  general: "Genel",
  payment: "Ödeme",
  shipment: "Sevkiyat",
  technical: "Teknik",
  account: "Hesap",
};

const PRIORITIES: Record<string, { label: string; class: string }> = {
  low: { label: "Düşük", class: "text-gray-500 border-gray-300" },
  normal: { label: "Normal", class: "text-blue-600 border-blue-300" },
  high: { label: "Yüksek", class: "text-orange-600 border-orange-300" },
  urgent: { label: "Acil", class: "text-red-600 border-red-300" },
};

const STATUS_OPTIONS = [
  { value: "open", label: "Açık" },
  { value: "in_progress", label: "İşlemde" },
  { value: "resolved", label: "Çözümlendi" },
  { value: "closed", label: "Kapalı" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "open":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 gap-1"><Clock className="h-3 w-3" />Açık</Badge>;
    case "in_progress":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0 gap-1"><RefreshCw className="h-3 w-3" />İşlemde</Badge>;
    case "resolved":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 gap-1"><CheckCircle2 className="h-3 w-3" />Çözümlendi</Badge>;
    case "closed":
      return <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-0 gap-1"><XCircle className="h-3 w-3" />Kapalı</Badge>;
    default: return null;
  }
}

function RoleBadge({ role }: { role: string }) {
  if (role === "corporate") return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-0 text-[10px]">Kurumsal</Badge>;
  if (role === "driver") return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0 text-[10px]">Şoför</Badge>;
  return null;
}

const FILTER_TABS = [
  { key: "all", label: "Tümü" },
  { key: "open", label: "Açık" },
  { key: "in_progress", label: "İşlemde" },
  { key: "resolved", label: "Çözümlendi" },
  { key: "closed", label: "Kapalı" },
];

export default function AdminSupport() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("in_progress");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const base = import.meta.env.BASE_URL ?? "/";
      const r = await fetch(`${base}api/support/tickets`.replace(/\/+/g, "/").replace(":/", "://"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-support-stats"],
    queryFn: async () => {
      const base = import.meta.env.BASE_URL ?? "/";
      const r = await fetch(`${base}api/support/stats`.replace(/\/+/g, "/").replace(":/", "://"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, adminReply, status }: { id: number; adminReply: string; status: string }) => {
      const base = import.meta.env.BASE_URL ?? "/";
      const r = await fetch(`${base}api/support/tickets/${id}`.replace(/\/+/g, "/").replace(":/", "://"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminReply, status }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-support-stats"] });
      setSelected(updated);
      setReply("");
      toast({ title: "Yanıt gönderildi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Yanıt gönderilemedi", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const base = import.meta.env.BASE_URL ?? "/";
      const r = await fetch(`${base}api/support/tickets/${id}`.replace(/\/+/g, "/").replace(":/", "://"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-support-stats"] });
      setSelected(updated);
      toast({ title: "Durum güncellendi" });
    },
  });

  const filtered = filter === "all"
    ? tickets
    : tickets.filter((t: any) => t.status === filter);

  function openTicket(ticket: any) {
    setSelected(ticket);
    setReply(ticket.adminReply ?? "");
    setNewStatus(ticket.status);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
          <HeadphonesIcon className="h-6 w-6 text-primary" />
          Destek Talepleri
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kullanıcıların destek taleplerini buradan yönetebilirsiniz.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Toplam" value={stats.total} color="text-foreground" />
          <StatCard label="Açık" value={stats.open} color="text-blue-600" />
          <StatCard label="İşlemde" value={stats.inProgress} color="text-yellow-600" />
          <StatCard label="Çözümlendi" value={stats.resolved} color="text-green-600" />
        </div>
      )}

      <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
        {FILTER_TABS.map(tab => {
          const count = tab.key === "all"
            ? tickets.length
            : tickets.filter((t: any) => t.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filter === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === tab.key ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <HeadphonesIcon className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-muted-foreground">Bu filtre için destek talebi bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket: any) => {
            const pr = PRIORITIES[ticket.priority] ?? PRIORITIES.normal;
            return (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:shadow-md transition-all border border-border/60"
                onClick={() => openTicket(ticket)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-foreground truncate max-w-xs">{ticket.subject}</span>
                      <StatusBadge status={ticket.status} />
                      <Badge variant="outline" className={`text-[10px] ${pr.class}`}>{pr.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.userName ?? "—"}
                        <RoleBadge role={ticket.userRole} />
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {CATEGORIES[ticket.category] ?? ticket.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(ticket.createdAt)}
                      </span>
                      {ticket.adminReply && (
                        <span className="text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Yanıtlandı
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base leading-snug pr-6">
              {selected?.subject}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selected.status} />
                <Badge variant="outline" className="text-xs">
                  {CATEGORIES[selected.category] ?? selected.category}
                </Badge>
                <Badge variant="outline" className={`text-xs ${PRIORITIES[selected.priority]?.class}`}>
                  {PRIORITIES[selected.priority]?.label ?? selected.priority}
                </Badge>
                <RoleBadge role={selected.userRole} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground bg-gray-50 rounded-lg p-3">
                <div>
                  <span className="font-medium text-foreground">Kullanıcı</span>
                  <p>{selected.userName ?? "—"}</p>
                  <p>{selected.userEmail ?? "—"}</p>
                </div>
                <div>
                  <span className="font-medium text-foreground">Tarih</span>
                  <p>{formatDate(selected.createdAt)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Kullanıcı Mesajı</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selected.message}</p>
              </div>

              {selected.adminReply && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Önceki Yanıtınız
                    {selected.repliedAt && <span className="ml-auto font-normal text-muted-foreground">{formatDate(selected.repliedAt)}</span>}
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selected.adminReply}</p>
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Yanıt Gönder / Durumu Güncelle</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Kullanıcıya yanıtınızı yazın..."
                  rows={4}
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  {reply.trim() === "" && newStatus !== selected.status && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => statusMutation.mutate({ id: selected.id, status: newStatus })}
                      disabled={statusMutation.isPending}
                    >
                      {statusMutation.isPending ? "Kaydediliyor..." : "Sadece Durumu Güncelle"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={!reply.trim() || replyMutation.isPending}
                    onClick={() => replyMutation.mutate({ id: selected.id, adminReply: reply, status: newStatus })}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {replyMutation.isPending ? "Gönderiliyor..." : "Yanıtla & Kaydet"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="border border-border/60">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value ?? 0}</p>
      </CardContent>
    </Card>
  );
}
