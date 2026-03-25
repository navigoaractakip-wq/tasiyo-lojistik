import { useState, useEffect } from "react";
import {
  useGetContracts,
  useGetContractStats,
  useUpdateContract,
  type Contract,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Save, Edit3, Clock, CheckCircle2, Loader2,
  Eye, Users, ShieldCheck, AlertCircle, ArrowRight, History,
} from "lucide-react";

const CONTRACT_META: Record<string, {
  label: string;
  description: string;
  required: boolean;
  color: string;
  bgColor: string;
  statKey: "terms" | "privacy" | "distance_sales" | "marketing" | "location";
}> = {
  terms: {
    label: "Kullanım Koşulları",
    description: "Tüm kullanıcıların onayladığı zorunlu sözleşme",
    required: true,
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    statKey: "terms",
  },
  privacy: {
    label: "Gizlilik Politikası & KVKK",
    description: "6698 sayılı KVKK kapsamında zorunlu aydınlatma metni",
    required: true,
    color: "text-violet-700",
    bgColor: "bg-violet-50 border-violet-200",
    statKey: "privacy",
  },
  distance_sales: {
    label: "Mesafeli Satış Sözleşmesi",
    description: "Kurumsal kullanıcıların ödeme/abonelik sözleşmesi",
    required: true,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    statKey: "distance_sales",
  },
  marketing: {
    label: "Ticari İleti Onayı",
    description: "İsteğe bağlı pazarlama iletişimi onayı",
    required: false,
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    statKey: "marketing",
  },
  location: {
    label: "Konum Verisi Onayı",
    description: "İsteğe bağlı konum verisi işleme onayı",
    required: false,
    color: "text-rose-700",
    bgColor: "bg-rose-50 border-rose-200",
    statKey: "location",
  },
};

const ORDER = ["terms", "privacy", "distance_sales", "marketing", "location"];

function formatPreview(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={key++} className="h-3" />);
    } else if (/^[A-ZÇĞİÖŞÜ\s]{6,}$/.test(trimmed) && !trimmed.startsWith("-")) {
      elements.push(
        <h2 key={key++} className="text-sm font-bold text-gray-900 mt-4 mb-1 uppercase tracking-wide">
          {trimmed}
        </h2>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const rest = trimmed.replace(/^\d+\.\s/, "");
      const num = trimmed.match(/^(\d+)/)?.[1];
      elements.push(
        <div key={key++} className="flex gap-2 mt-2">
          <span className="text-xs font-bold text-gray-500 mt-0.5 w-5 flex-shrink-0">{num}.</span>
          <p className="text-sm text-gray-700 leading-relaxed">{rest}</p>
        </div>
      );
    } else if (/^\d+\.\d+\.\s/.test(trimmed)) {
      elements.push(
        <p key={key++} className="text-sm text-gray-600 ml-6 leading-relaxed mt-1">
          {trimmed}
        </p>
      );
    } else if (trimmed.startsWith("-")) {
      elements.push(
        <div key={key++} className="flex gap-2 ml-4 mt-1">
          <span className="text-gray-400 mt-1 flex-shrink-0">•</span>
          <p className="text-sm text-gray-700 leading-relaxed">{trimmed.slice(1).trim()}</p>
        </div>
      );
    } else {
      elements.push(
        <p key={key++} className="text-sm text-gray-700 leading-relaxed mt-1">
          {trimmed}
        </p>
      );
    }
  }

  return elements;
}

function ContractPanel({
  contract,
  statCount,
  totalUsers,
}: {
  contract: Contract;
  statCount: number;
  totalUsers: number;
}) {
  const { toast } = useToast();
  const { mutate: update, isPending } = useUpdateContract();
  const [tab, setTab] = useState<"preview" | "edit">("preview");
  const [content, setContent] = useState(contract.content);
  const [title, setTitle] = useState(contract.title);

  useEffect(() => {
    setContent(contract.content);
    setTitle(contract.title);
    setTab("preview");
  }, [contract.key, contract.content, contract.title]);

  const meta = CONTRACT_META[contract.key];
  const hasChanges = content !== contract.content || title !== contract.title;
  const consentPct = totalUsers > 0 ? Math.round((statCount / totalUsers) * 100) : 0;

  const updatedAt = new Date(contract.updatedAt).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handleSave = () => {
    if (!content.trim()) {
      toast({ title: "Hata", description: "İçerik boş bırakılamaz.", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Hata", description: "Başlık boş bırakılamaz.", variant: "destructive" });
      return;
    }
    update(
      { key: contract.key, content: content.trim(), title: title.trim() },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast({
              title: "Sözleşme Güncellendi",
              description: `Yeni sürüm: v${data.contract.version} — Kayıt olan kullanıcılar bu sürümü referans alacak.`,
            });
            setTab("preview");
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
    setTab("preview");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {meta?.required ? (
                <Badge className="text-[10px] bg-blue-600 text-white border-0 h-5">Zorunlu Onay</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-gray-500 h-5">İsteğe Bağlı</Badge>
              )}
              <Badge variant="outline" className="text-[10px] font-mono h-5 gap-1">
                <History className="w-2.5 h-2.5" />
                Sürüm {contract.version}
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{contract.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{meta?.description}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{updatedAt}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5" />
            <span>
              <span className="font-semibold text-gray-800">{statCount}</span> kullanıcı onayladı
              {totalUsers > 0 && (
                <span className="text-gray-400 ml-1">(%{consentPct})</span>
              )}
            </span>
          </div>
        </div>

        {/* Consent bar */}
        {totalUsers > 0 && (
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${consentPct}%` }}
            />
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 mt-4">
          <button
            onClick={() => setTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === "preview"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Önizle
          </button>
          <button
            onClick={() => setTab("edit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === "edit"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Düzenle
            {hasChanges && tab !== "edit" && (
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {tab === "preview" ? (
          <div className="h-full overflow-y-auto px-6 py-5">
            {contract.content ? (
              <div className="prose prose-sm max-w-none">
                {formatPreview(contract.content)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <FileText className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Henüz içerik eklenmemiş.</p>
                <button
                  onClick={() => setTab("edit")}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  Düzenlemeye başla <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full px-6 py-4 gap-3">
            {/* Title input */}
            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-gray-600 mb-1">Sözleşme Başlığı</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-sm font-semibold"
                placeholder="Sözleşme başlığı..."
              />
            </div>

            {/* Content textarea */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">Sözleşme İçeriği</label>
                <span className="text-[10px] text-gray-400">{content.length} karakter</span>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 font-mono text-xs resize-none leading-relaxed min-h-0"
                placeholder="Sözleşme içeriğini buraya yazın..."
              />
            </div>

            {/* Warning + actions */}
            <div className="flex-shrink-0 space-y-2">
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-amber-700">
                  Kaydettiğinizde sürüm numarası otomatik artar. Yeni kayıtlar bu sürümü referans alır, önceki onaylar geçerliliğini korur.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="h-8 text-xs"
                >
                  İptal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending || !hasChanges}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                >
                  {isPending ? (
                    <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />Kaydediliyor...</>
                  ) : (
                    <><Save className="w-3 h-3 mr-1.5" />Kaydet & Yayınla</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminContracts() {
  const { data: contractsData, isLoading: loadingContracts } = useGetContracts();
  const { data: statsData } = useGetContractStats();
  const [selectedKey, setSelectedKey] = useState<string>("terms");

  const contracts = contractsData?.contracts ?? [];
  const stats = statsData?.stats;
  const totalUsers = stats?.total ?? 0;

  const sorted = ORDER
    .map((key) => contracts.find((c) => c.key === key))
    .filter(Boolean) as Contract[];

  const selectedContract = sorted.find((c) => c.key === selectedKey) ?? sorted[0];

  const getStatCount = (key: string) => {
    if (!stats) return 0;
    return stats[key as keyof typeof stats] as number ?? 0;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-gray-100 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sözleşme Yönetimi</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Kayıt ekranında kullanıcıların okuması ve onaylaması gereken sözleşme metinlerini düzenleyin.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <div className="text-xs text-blue-800">
              <p className="font-semibold">KVKK & 6563 Uyumlu</p>
              <p className="text-blue-600">Onaylar IP + sürüm ile loglanır</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — contract list */}
        <div className="w-72 flex-shrink-0 border-r border-gray-100 bg-gray-50 overflow-y-auto">
          <div className="p-3 space-y-1">
            {loadingContracts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">
                Sözleşmeler yükleniyor...
              </div>
            ) : (
              sorted.map((contract) => {
                const meta = CONTRACT_META[contract.key];
                const count = getStatCount(meta?.statKey ?? contract.key);
                const isSelected = selectedKey === contract.key;

                return (
                  <button
                    key={contract.key}
                    onClick={() => setSelectedKey(contract.key)}
                    className={`w-full text-left rounded-xl p-3 transition-all ${
                      isSelected
                        ? "bg-white shadow-sm border border-gray-200"
                        : "hover:bg-white hover:shadow-sm border border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${meta?.bgColor}`}>
                        <FileText className={`w-4 h-4 ${meta?.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className={`text-xs font-semibold leading-tight truncate ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                            {meta?.label ?? contract.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {meta?.required ? (
                            <span className="text-[9px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Zorunlu</span>
                          ) : (
                            <span className="text-[9px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Opsiyonel</span>
                          )}
                          <span className="text-[9px] text-gray-400 font-mono">v{contract.version}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Users className="w-2.5 h-2.5 text-gray-400" />
                          <span className="text-[10px] text-gray-500">
                            <span className="font-medium text-gray-700">{count}</span> onay
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom KVKK note */}
          <div className="p-3 mt-2 border-t border-gray-200">
            <div className="flex items-start gap-2 bg-white border border-gray-200 rounded-lg p-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Zorunlu sözleşmeler kayıtta önceden işaretli <strong className="text-gray-700">sunulamaz</strong>. Kullanıcı aktif olarak onaylamalıdır.
              </p>
            </div>
          </div>
        </div>

        {/* Right panel — editor */}
        <div className="flex-1 bg-white overflow-hidden">
          {!selectedContract && !loadingContracts ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Sol menüden bir sözleşme seçin</p>
            </div>
          ) : selectedContract ? (
            <ContractPanel
              key={selectedContract.key}
              contract={selectedContract}
              statCount={getStatCount(CONTRACT_META[selectedContract.key]?.statKey ?? selectedContract.key)}
              totalUsers={totalUsers}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
