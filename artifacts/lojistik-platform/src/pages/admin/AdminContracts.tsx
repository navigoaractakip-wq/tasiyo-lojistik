import { useState } from "react";
import { useGetContracts, useUpdateContract, type Contract } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Save, Edit3, Clock, CheckCircle2, Loader2,
  ChevronDown, ChevronUp, Info,
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

const CONTRACT_LABELS: Record<string, { label: string; description: string; required: boolean }> = {
  terms: {
    label: "Kullanım Koşulları",
    description: "Tüm kullanıcıların kayıt sırasında onayladığı zorunlu sözleşme.",
    required: true,
  },
  privacy: {
    label: "Gizlilik Politikası & KVKK Aydınlatma Metni",
    description: "6698 sayılı KVKK kapsamında hazırlanan zorunlu aydınlatma metni.",
    required: true,
  },
  distance_sales: {
    label: "Mesafeli Satış Sözleşmesi",
    description: "Kurumsal kullanıcıların onayladığı ödeme/abonelik sözleşmesi.",
    required: true,
  },
  marketing: {
    label: "Ticari Elektronik İleti Onayı",
    description: "Kullanıcının isteğe bağlı pazarlama iletişimine verdiği onay metni.",
    required: false,
  },
  location: {
    label: "Konum Verisi İşleme Onayı",
    description: "Kullanıcının isteğe bağlı konum verisi işlenmesine verdiği onay metni.",
    required: false,
  },
};

const ORDER = ["terms", "privacy", "distance_sales", "marketing", "location"];

function ContractEditor({ contract }: { contract: Contract }) {
  const { toast } = useToast();
  const { mutate: update, isPending } = useUpdateContract();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(contract.content);
  const [title, setTitle] = useState(contract.title);
  const [open, setOpen] = useState(false);

  const meta = CONTRACT_LABELS[contract.key] ?? {
    label: contract.title,
    description: "",
    required: false,
  };

  const hasChanges = content !== contract.content || title !== contract.title;

  const handleSave = () => {
    if (!content.trim()) {
      toast({ title: "Hata", description: "İçerik boş bırakılamaz.", variant: "destructive" });
      return;
    }
    update(
      { key: contract.key, content: content.trim(), title: title.trim() },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast({
              title: "Kaydedildi",
              description: `"${meta.label}" sözleşmesi güncellendi. Yeni sürüm: v${data.contract.version}`,
            });
            setEditing(false);
          }
        },
        onError: () => {
          toast({ title: "Hata", description: "Sözleşme kaydedilemedi.", variant: "destructive" });
        },
      }
    );
  };

  const handleCancel = () => {
    setContent(contract.content);
    setTitle(contract.title);
    setEditing(false);
  };

  const updatedAt = new Date(contract.updatedAt).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              meta.required ? "bg-blue-100" : "bg-gray-100"
            }`}>
              <FileText className={`w-4 h-4 ${meta.required ? "text-blue-600" : "text-gray-500"}`} />
            </div>
            <div className="min-w-0">
              {editing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-7 text-sm font-semibold mb-1"
                />
              ) : (
                <CardTitle className="text-base">{contract.title}</CardTitle>
              )}
              <CardDescription className="text-xs mt-0.5">{meta.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {meta.required ? (
              <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">Zorunlu</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-gray-500">İsteğe Bağlı</Badge>
            )}
            <Badge variant="outline" className="text-[10px] font-mono">v{contract.version}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Son güncelleme: {updatedAt}</span>
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-xs min-h-[320px] resize-y"
              placeholder="Sözleşme içeriğini buraya yazın..."
            />
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>Kaydettiğinizde sürüm numarası otomatik artar ve yeni kayıt onayları bu sürümü referans alır.</span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isPending}>
                  İptal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending || !hasChanges}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isPending ? (
                    <><Loader2 className="w-3 h-3 animate-spin mr-1" />Kaydediliyor...</>
                  ) : (
                    <><Save className="w-3 h-3 mr-1" />Kaydet</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Collapsible open={open} onOpenChange={setOpen}>
            <div className="flex items-center justify-between gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground px-2">
                  {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {open ? "Gizle" : "Önizle"}
                </Button>
              </CollapsibleTrigger>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => { setEditing(true); setOpen(false); }}
              >
                <Edit3 className="w-3 h-3" />
                Düzenle
              </Button>
            </div>
            <CollapsibleContent>
              <div className="mt-2 bg-gray-50 border rounded-md p-3 max-h-72 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {contract.content || <em className="text-muted-foreground">İçerik henüz eklenmemiş.</em>}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminContracts() {
  const { data, isLoading } = useGetContracts();

  const contracts = data?.contracts ?? [];
  const sorted = ORDER
    .map((key) => contracts.find((c) => c.key === key))
    .filter(Boolean) as Contract[];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sözleşme Yönetimi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kullanıcıların kayıt sırasında onayladığı KVKK uyumlu sözleşme metinlerini düzenleyin.
          Her kayıt işleminde sözleşme versiyonu ve kullanıcı IP adresi loglanır.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-800 space-y-0.5">
          <p className="font-semibold">KVKK & 6563 Sayılı Kanun Uyumu</p>
          <p>Zorunlu onaylar (Kullanım Koşulları ve Gizlilik/KVKK) önceden işaretli sunulamaz. İsteğe bağlı onaylar (pazarlama, konum) kullanıcı tarafından aktif olarak seçilmelidir. Tüm onaylar timestamp ve IP adresiyle birlikte değişmez şekilde kaydedilir.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Sözleşmeler yükleniyor veya henüz oluşturulmadı. Sunucu yeniden başlatıldıktan sonra otomatik oluşturulur.
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((c) => (
            <ContractEditor key={c.key} contract={c} />
          ))}
        </div>
      )}
    </div>
  );
}
