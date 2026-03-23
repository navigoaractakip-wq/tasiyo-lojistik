import { useState, useEffect } from "react";
import {
  useGetSettings,
  useUpdateSettings,
  useTestSms,
  useTestEmail,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Mail,
  Settings2,
  Save,
  TestTube2,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

type SettingRow = {
  id: number;
  key: string;
  label: string;
  description?: string;
  group: string;
  isSecret: boolean;
  value?: string;
};

type Group = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

const GROUPS: Group[] = [
  {
    id: "sms",
    label: "SMS Ayarları (Twilio)",
    description: "OTP doğrulama SMS'leri için Twilio entegrasyonu",
    icon: <MessageSquare className="w-5 h-5" />,
    color: "text-red-600",
  },
  {
    id: "email",
    label: "E-posta Ayarları (SMTP)",
    description: "OTP doğrulama e-postaları için SMTP sunucu yapılandırması",
    icon: <Mail className="w-5 h-5" />,
    color: "text-blue-600",
  },
  {
    id: "platform",
    label: "Platform Ayarları",
    description: "Genel platform yapılandırma seçenekleri",
    icon: <Settings2 className="w-5 h-5" />,
    color: "text-purple-600",
  },
];

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 h-7 w-7"
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </Button>
    </div>
  );
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testEmailAddr, setTestEmailAddr] = useState("");

  const { data: settingsData, isLoading, refetch } = useGetSettings();

  useEffect(() => {
    if (settingsData && !initialized) {
      const initial: Record<string, string> = {};
      settingsData.settings.forEach((s: SettingRow) => {
        initial[s.key] = s.value ?? "";
      });
      setValues(initial);
      setInitialized(true);
    }
  }, [settingsData, initialized]);

  const { mutate: saveSettings, isPending: isSaving } = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        toast({ title: "Ayarlar Kaydedildi", description: "Tüm ayarlar başarıyla güncellendi." });
        setInitialized(false);
        refetch();
      },
      onError: () => {
        toast({ title: "Hata", description: "Ayarlar kaydedilemedi.", variant: "destructive" });
      },
    },
  });

  const { mutate: doTestSms, isPending: isTestingSms } = useTestSms({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: data.success ? "SMS Gönderildi" : "Yapılandırılmamış",
          description: data.message,
          variant: data.success ? "default" : "destructive",
        });
      },
    },
  });

  const { mutate: doTestEmail, isPending: isTestingEmail } = useTestEmail({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: data.success ? "E-posta Gönderildi" : "Yapılandırılmamış",
          description: data.message,
          variant: data.success ? "default" : "destructive",
        });
      },
    },
  });

  const handleSave = () => {
    const settings = Object.entries(values).map(([key, value]) => ({
      key,
      value: value || undefined,
    }));
    saveSettings({ data: { settings } });
  };

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const settings: SettingRow[] = settingsData?.settings ?? [];

  const isConfigured = (groupId: string) => {
    const groupSettings = settings.filter((s) => s.group === groupId);
    return groupSettings.some((s) => {
      const v = values[s.key];
      return v && v !== "••••••••" && v.trim() !== "";
    }) || groupSettings.some((s) => s.value === "••••••••");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Ayarları</h1>
          <p className="text-muted-foreground mt-1">
            SMS, e-posta ve genel platform yapılandırma ayarları
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Kaydet
        </Button>
      </div>

      {/* Info Banner */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <Info className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <strong>Gizli Alanlar:</strong> Kaydedilmiş gizli değerler "••••••••" olarak görünür.
          Değiştirmek istemiyorsanız bu alanları boş bırakın — mevcut değer korunur.
          Boş bırakılırsa OTP kodları konsola yazılır (geliştirme modu aktif).
        </div>
      </div>

      {GROUPS.map((group) => {
        const groupSettings = settings.filter((s) => s.group === group.id);
        const configured = isConfigured(group.id);

        return (
          <Card key={group.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${group.color}`}>{group.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{group.label}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </div>
                </div>
                <Badge
                  variant={configured ? "default" : "secondary"}
                  className={configured ? "bg-green-100 text-green-700 border-green-200" : ""}
                >
                  {configured ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Yapılandırıldı</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Yapılandırılmadı</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupSettings.map((setting) => (
                <div key={setting.key} className="space-y-1.5">
                  <Label htmlFor={setting.key} className="font-medium">
                    {setting.label}
                    {setting.isSecret && (
                      <Badge variant="outline" className="ml-2 text-xs font-normal">
                        Gizli
                      </Badge>
                    )}
                  </Label>
                  {setting.description && (
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  )}
                  {setting.isSecret ? (
                    <SecretInput
                      value={values[setting.key] ?? ""}
                      onChange={(v) => handleChange(setting.key, v)}
                      placeholder={
                        setting.value === "••••••••"
                          ? "Değiştirmek için yeni değer girin"
                          : `${setting.label} girin`
                      }
                    />
                  ) : (
                    <Input
                      id={setting.key}
                      value={values[setting.key] ?? ""}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      placeholder={`${setting.label} girin`}
                    />
                  )}
                </div>
              ))}

              {/* Test Buttons */}
              {group.id === "sms" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SMS Testi</Label>
                    <p className="text-xs text-muted-foreground">
                      Twilio ayarlarını kaydedin, ardından test SMS gönderin.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="+90 555 000 0000"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => doTestSms({ data: { phone: testPhone } })}
                        disabled={isTestingSms || !testPhone}
                        className="gap-2 shrink-0"
                      >
                        {isTestingSms ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube2 className="w-4 h-4" />
                        )}
                        Test SMS
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {group.id === "email" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">E-posta Testi</Label>
                    <p className="text-xs text-muted-foreground">
                      SMTP ayarlarını kaydedin, ardından test e-postası gönderin.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="test@ornek.com"
                        value={testEmailAddr}
                        onChange={(e) => setTestEmailAddr(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          doTestEmail({ data: { email: testEmailAddr } })
                        }
                        disabled={isTestingEmail || !testEmailAddr}
                        className="gap-2 shrink-0"
                      >
                        {isTestingEmail ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube2 className="w-4 h-4" />
                        )}
                        Test E-posta
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Tüm Ayarları Kaydet
        </Button>
      </div>
    </div>
  );
}
