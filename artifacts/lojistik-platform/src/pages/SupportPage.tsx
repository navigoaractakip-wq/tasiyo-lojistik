import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  MessageSquare, Plus, Clock, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, HeadphonesIcon, RefreshCw, Wrench, FileText,
  ArrowLeft, MapPin, Inbox, Send,
} from "lucide-react";

// ─── Shared helpers ────────────────────────────────────────────────────────────

const PRIORITIES = [
  { value: "low", label: "Düşük" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Yüksek" },
  { value: "urgent", label: "Acil" },
];

function statusBadge(status: string) {
  switch (status) {
    case "open":      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">Açık</Badge>;
    case "in_progress": return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">İşlemde</Badge>;
    case "resolved":  return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">Çözümlendi</Badge>;
    case "closed":    return <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-0">Kapalı</Badge>;
    default:          return null;
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "open":        return <Clock className="h-4 w-4 text-blue-500" />;
    case "in_progress": return <RefreshCw className="h-4 w-4 text-yellow-500" />;
    case "resolved":    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "closed":      return <XCircle className="h-4 w-4 text-gray-400" />;
    default:            return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function priorityLabel(p: string) {
  return PRIORITIES.find(x => x.value === p)?.label ?? p;
}

// ─── Ticket detail dialog (shared) ─────────────────────────────────────────────

function TicketDetailDialog({
  ticket, token, onClose, canReply,
}: {
  ticket: any; token: string; onClose: () => void; canReply?: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [replyText, setReplyText] = useState("");
  const [isPending, setIsPending] = useState(false);

  const isListing = ticket?.category === "listing";
  const isIncoming = ticket?.isIncoming;

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setIsPending(true);
    try {
      const base = import.meta.env.BASE_URL ?? "/";
      const r = await fetch(`${base}api/support/tickets/${ticket.id}`.replace(/\/+/g, "/").replace(":/", "://"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminReply: replyText, status: "in_progress" }),
      });
      if (!r.ok) throw new Error();
      toast({ title: "Yanıt gönderildi" });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      onClose();
    } catch {
      toast({ title: "Hata", description: "Yanıt gönderilemedi.", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  const closeTicket = async () => {
    const base = import.meta.env.BASE_URL ?? "/";
    const r = await fetch(`${base}api/support/tickets/${ticket.id}`.replace(/\/+/g, "/").replace(":/", "://"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "closed" }),
    });
    if (r.ok) {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      toast({ title: "Talep kapatıldı" });
      onClose();
    }
  };

  if (!ticket) return null;

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <StatusIcon status={ticket.status} />
          {ticket.subject}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-1">
        <div className="flex flex-wrap gap-2">
          {statusBadge(ticket.status)}
          {isListing ? (
            <Badge variant="outline" className="text-xs gap-1"><FileText className="w-3 h-3" />İlan Hakkında</Badge>
          ) : (
            <Badge variant="outline" className="text-xs gap-1"><Wrench className="w-3 h-3" />Teknik Destek</Badge>
          )}
          {ticket.priority && ticket.priority !== "normal" && (
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">{priorityLabel(ticket.priority)}</Badge>
          )}
        </div>

        {/* Load info for listing tickets */}
        {isListing && ticket.loadTitle && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-blue-700">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>İlan: <strong>{ticket.loadTitle}</strong></span>
          </div>
        )}

        {/* Sender info for incoming tickets */}
        {isIncoming && ticket.senderName && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Send className="h-3 w-3" />
            Gönderen: <strong>{ticket.senderName}</strong> ({ticket.senderRole === "driver" ? "Şoför" : "Bireysel"})
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Mesaj</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.message}</p>
          <p className="text-xs text-muted-foreground mt-3">{formatDate(ticket.createdAt)}</p>
        </div>

        {ticket.adminReply ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs text-green-700 mb-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {isIncoming ? "Yanıtınız" : "Yanıt"}
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.adminReply}</p>
            {ticket.repliedAt && (
              <p className="text-xs text-muted-foreground mt-3">{formatDate(ticket.repliedAt)}</p>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-sm text-yellow-700">
            <Clock className="h-4 w-4 flex-shrink-0" />
            {isIncoming ? "Henüz yanıt vermediniz." : "Talebiniz inceleniyor."}
          </div>
        )}

        {/* Reply box for corporate (incoming) or admin */}
        {canReply && !ticket.adminReply && ticket.status !== "closed" && ticket.status !== "resolved" && (
          <div className="space-y-2">
            <Label className="text-sm">Yanıtınız</Label>
            <Textarea
              placeholder="Yanıtınızı yazın..."
              rows={3}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className="resize-none text-sm"
            />
            <Button
              size="sm"
              className="w-full"
              disabled={!replyText.trim() || isPending}
              onClick={sendReply}
            >
              {isPending ? "Gönderiliyor…" : "Yanıtı Gönder"}
            </Button>
          </div>
        )}

        {ticket.status !== "closed" && ticket.status !== "resolved" && !canReply && ticket.userId && (
          <div className="flex justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={closeTicket}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Talebi Kapat
            </Button>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

// ─── New ticket form for DRIVER ─────────────────────────────────────────────────

type TicketCategory = "technical" | "listing" | null;

function DriverNewTicketDialog({ token, onClose }: { token: string; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState<TicketCategory>(null);
  const [form, setForm] = useState({ subject: "", priority: "normal", message: "", loadId: "" });
  const [isPending, setIsPending] = useState(false);

  const { data: myLoads = [] } = useQuery({
    queryKey: ["support-my-loads"],
    queryFn: async () => {
      const r = await fetch("/api/support/my-loads", { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: step === "listing",
  });

  const submit = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    if (step === "listing" && !form.loadId) {
      toast({ title: "Hata", description: "Lütfen bir ilan seçin.", variant: "destructive" });
      return;
    }
    setIsPending(true);
    try {
      const body: any = {
        subject: form.subject,
        category: step,
        priority: form.priority,
        message: form.message,
      };
      if (step === "listing") body.loadId = Number(form.loadId);

      const r = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error ?? "Talep oluşturulamadı");
      }
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      toast({ title: "Talebiniz alındı", description: "En kısa sürede size dönüş yapılacaktır." });
      onClose();
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Yeni Destek Talebi
        </DialogTitle>
      </DialogHeader>

      {/* Step 0: category selection */}
      {step === null && (
        <div className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">Ne konusunda yardıma ihtiyacınız var?</p>
          <button
            onClick={() => setStep("technical")}
            className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Teknik Destek</p>
              <p className="text-xs text-muted-foreground mt-0.5">Uygulama, hesap veya teknik sorunlar için süper admin'e iletin.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-1 shrink-0" />
          </button>
          <button
            onClick={() => setStep("listing")}
            className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-accent hover:bg-accent/5 transition-all text-left group"
          >
            <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">İlan Hakkında</p>
              <p className="text-xs text-muted-foreground mt-0.5">Bir yük ilanı hakkında sorunuz mu var? İlan sahibine doğrudan iletin.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-1 shrink-0" />
          </button>
        </div>
      )}

      {/* Step 1: form */}
      {step !== null && (
        <div className="space-y-4 pt-2">
          {/* Category indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep(null)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            {step === "technical" ? (
              <Badge className="bg-blue-100 text-blue-700 border-0 gap-1.5"><Wrench className="w-3 h-3" />Teknik Destek</Badge>
            ) : (
              <Badge className="bg-orange-100 text-orange-700 border-0 gap-1.5"><FileText className="w-3 h-3" />İlan Hakkında</Badge>
            )}
            <span className="text-xs text-muted-foreground ml-1">
              {step === "technical" ? "→ Süper Admin" : "→ İlan Sahibi"}
            </span>
          </div>

          {/* Load selector (listing only) */}
          {step === "listing" && (
            <div className="space-y-1.5">
              <Label>Hangi ilan hakkında? <span className="text-red-500">*</span></Label>
              <Select value={form.loadId} onValueChange={v => setForm(f => ({ ...f, loadId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="İlan seçin…" />
                </SelectTrigger>
                <SelectContent>
                  {myLoads.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">Aktif ilan bulunamadı</div>
                  ) : (
                    myLoads.map((l: any) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        <span className="font-medium">{l.title}</span>
                        <span className="text-muted-foreground text-xs ml-2">{l.origin} → {l.destination}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Konu <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Talebinizin konusunu kısaca belirtin"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Öncelik</Label>
            <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Mesajınız <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="Sorununuzu veya talebinizi detaylı açıklayın..."
              rows={4}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={onClose}>İptal</Button>
            <Button
              onClick={submit}
              disabled={!form.subject.trim() || !form.message.trim() || isPending || (step === "listing" && !form.loadId)}
            >
              {isPending ? "Gönderiliyor…" : "Talebi Gönder"}
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  );
}

// ─── Main SupportPage ───────────────────────────────────────────────────────────

export default function SupportPage() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [inboxTab, setInboxTab] = useState<"sent" | "incoming">("sent");

  // Generic form for corporate/admin
  const [form, setForm] = useState({ subject: "", category: "general", priority: "normal", message: "" });

  const role = (user as any)?.role ?? "driver";
  const isDriver = role === "driver" || role === "individual";
  const isCorporate = role === "corporate";
  const isAdmin = role === "admin";

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const r = await fetch("/api/support/tickets", { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error("Talepler yüklenemedi");
      return r.json();
    },
  });

  // For corporate: split tickets into sent (own) and incoming (addressed to them)
  const sentTickets = isCorporate ? tickets.filter((t: any) => !t.isIncoming) : tickets;
  const incomingTickets = isCorporate ? tickets.filter((t: any) => t.isIncoming) : [];
  const displayedTickets = isCorporate ? (inboxTab === "sent" ? sentTickets : incomingTickets) : tickets;

  // Corporate generic create mutation
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

  const openCount = sentTickets.filter((t: any) => t.status === "open" || t.status === "in_progress").length;
  const incomingUnreplied = incomingTickets.filter((t: any) => !t.adminReply).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <HeadphonesIcon className="h-6 w-6 text-primary" />
            Destek Merkezi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isCorporate
              ? "Kendi talepleriniz ve size gelen sorular"
              : "Sorun mu yaşıyorsunuz? Size yardımcı olmaktan memnuniyet duyarız."}
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Talep
        </Button>
      </div>

      {/* Corporate tabs */}
      {isCorporate && (
        <div className="flex gap-2 border-b border-border/40 pb-1">
          <button
            onClick={() => setInboxTab("sent")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${inboxTab === "sent" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Send className="h-3.5 w-3.5" />
            Gönderdiğim Talepler
            {openCount > 0 && <span className="bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{openCount}</span>}
          </button>
          <button
            onClick={() => setInboxTab("incoming")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${inboxTab === "incoming" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Inbox className="h-3.5 w-3.5" />
            Gelen Mesajlar
            {incomingUnreplied > 0 && <span className="bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{incomingUnreplied}</span>}
          </button>
        </div>
      )}

      {openCount > 0 && (!isCorporate || inboxTab === "sent") && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-blue-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{openCount} açık destek talebiniz bulunuyor.</span>
        </div>
      )}

      {isCorporate && inboxTab === "incoming" && incomingUnreplied > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-orange-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{incomingUnreplied} yanıtlanmamış şoför mesajı var.</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : displayedTickets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {isCorporate && inboxTab === "incoming" ? (
                <Inbox className="h-8 w-8 text-primary" />
              ) : (
                <MessageSquare className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {isCorporate && inboxTab === "incoming" ? "Gelen mesaj yok" : "Henüz destek talebiniz yok"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isCorporate && inboxTab === "incoming"
                  ? "İlanlarınız hakkında şoförlerden gelen mesajlar burada görünür."
                  : "Bir sorunla karşılaşırsanız destek talebi oluşturabilirsiniz."}
              </p>
            </div>
            {inboxTab !== "incoming" && (
              <Button onClick={() => setNewOpen(true)} variant="outline" className="gap-2 mt-2">
                <Plus className="h-4 w-4" />
                İlk Talebimi Oluştur
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedTickets.map((ticket: any) => (
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
                    {ticket.category === "listing" && (
                      <Badge variant="outline" className="text-[10px] gap-1 text-orange-600 border-orange-200">
                        <FileText className="w-2.5 h-2.5" />İlan
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {ticket.isIncoming && ticket.senderName && (
                      <span className="text-orange-600 font-medium">↙ {ticket.senderName}</span>
                    )}
                    {ticket.loadTitle && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ticket.loadTitle}</span>
                    )}
                    <span>{formatDate(ticket.createdAt)}</span>
                    {ticket.adminReply && (
                      <span className="text-green-600 font-medium">✓ Yanıt var</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New ticket dialog — driver gets category selection, others get standard form */}
      <Dialog open={newOpen} onOpenChange={open => { setNewOpen(open); }}>
        {isDriver ? (
          <DriverNewTicketDialog token={token!} onClose={() => setNewOpen(false)} />
        ) : (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Yeni Destek Talebi
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
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
        )}
      </Dialog>

      {/* Ticket detail dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={open => !open && setSelectedTicket(null)}>
        <TicketDetailDialog
          ticket={selectedTicket}
          token={token!}
          onClose={() => setSelectedTicket(null)}
          canReply={isCorporate && selectedTicket?.isIncoming}
        />
      </Dialog>
    </div>
  );
}
