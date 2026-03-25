import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  HeadphonesIcon,
  RefreshCw,
} from "lucide-react";

const CATEGORIES = [
  { value: "general", label: "Genel" },
  { value: "payment", label: "Ödeme" },
  { value: "shipment", label: "Sevkiyat" },
  { value: "technical", label: "Teknik Destek" },
  { value: "account", label: "Hesap" },
];

const PRIORITIES = [
  { value: "low", label: "Düşük" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Yüksek" },
  { value: "urgent", label: "Acil" },
];

function statusBadge(status: string) {
  switch (status) {
    case "open":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">Açık</Badge>;
    case "in_progress":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">İşlemde</Badge>;
    case "resolved":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">Çözümlendi</Badge>;
    case "closed":
      return <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-0">Kapalı</Badge>;
    default:
      return null;
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "open": return <Clock className="h-4 w-4 text-blue-500" />;
    case "in_progress": return <RefreshCw className="h-4 w-4 text-yellow-500" />;
    case "resolved": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "closed": return <XCircle className="h-4 w-4 text-gray-400" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
}

function priorityLabel(p: string) {
  return PRIORITIES.find(x => x.value === p)?.label ?? p;
}

function categoryLabel(c: string) {
  return CATEGORIES.find(x => x.value === c)?.label ?? c;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function SupportPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const [form, setForm] = useState({
    subject: "",
    category: "general",
    priority: "normal",
    message: "",
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const r = await fetch("/api/support/tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Talepler yüklenemedi");
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Talep oluşturulamadı");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      setNewOpen(false);
      setForm({ subject: "", category: "general", priority: "normal", message: "" });
      toast({ title: "Talebiniz alındı", description: "En kısa sürede size dönüş yapılacaktır." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Talep oluşturulamadı, tekrar deneyin.", variant: "destructive" });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/support/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "closed" }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      setSelectedTicket(null);
      toast({ title: "Talep kapatıldı" });
    },
  });

  const openCount = tickets.filter((t: any) => t.status === "open" || t.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <HeadphonesIcon className="h-6 w-6 text-primary" />
            Destek Merkezi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sorun mu yaşıyorsunuz? Size yardımcı olmaktan memnuniyet duyarız.
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Talep
        </Button>
      </div>

      {openCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-blue-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{openCount} açık destek talebiniz bulunuyor.</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Henüz destek talebiniz yok</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Bir sorunla karşılaşırsanız destek talebi oluşturabilirsiniz.
              </p>
            </div>
            <Button onClick={() => setNewOpen(true)} variant="outline" className="gap-2 mt-2">
              <Plus className="h-4 w-4" />
              İlk Talebimi Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:shadow-md transition-shadow border border-border/60"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-shrink-0">
                  <StatusIcon status={ticket.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground truncate">{ticket.subject}</p>
                    {statusBadge(ticket.status)}
                    {ticket.priority === "high" || ticket.priority === "urgent" ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                        {priorityLabel(ticket.priority)}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{categoryLabel(ticket.category)}</span>
                    <span>·</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                    {ticket.adminReply && (
                      <>
                        <span>·</span>
                        <span className="text-green-600 font-medium">Yanıt var</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Yeni Destek Talebi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Öncelik</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Konu</Label>
              <Input
                placeholder="Talebinizin konusunu kısaca belirtin"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mesajınız</Label>
              <Textarea
                placeholder="Sorununuzu veya talebinizi detaylı bir şekilde açıklayın..."
                rows={5}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setNewOpen(false)}>İptal</Button>
              <Button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.subject.trim() || !form.message.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Gönderiliyor..." : "Talebi Gönder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTicket} onOpenChange={open => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <StatusIcon status={selectedTicket?.status ?? "open"} />
              {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 pt-1">
              <div className="flex flex-wrap gap-2">
                {statusBadge(selectedTicket.status)}
                <Badge variant="outline" className="text-xs">{categoryLabel(selectedTicket.category)}</Badge>
                <Badge variant="outline" className="text-xs">{priorityLabel(selectedTicket.priority)}</Badge>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Talebiniz</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
                <p className="text-xs text-muted-foreground mt-3">{formatDate(selectedTicket.createdAt)}</p>
              </div>

              {selectedTicket.adminReply ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs text-green-700 mb-1 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Destek Yanıtı
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTicket.adminReply}</p>
                  {selectedTicket.repliedAt && (
                    <p className="text-xs text-muted-foreground mt-3">{formatDate(selectedTicket.repliedAt)}</p>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-sm text-yellow-700">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  Talebiniz inceleniyor. En kısa sürede yanıt verilecektir.
                </div>
              )}

              {selectedTicket.status !== "closed" && selectedTicket.status !== "resolved" && (
                <div className="flex justify-end pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => closeMutation.mutate(selectedTicket.id)}
                    disabled={closeMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Talebi Kapat
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
