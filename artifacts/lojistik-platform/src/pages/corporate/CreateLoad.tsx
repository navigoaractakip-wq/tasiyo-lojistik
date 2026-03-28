import { useState } from "react";
import { useCreateLoad } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Truck, Calendar, DollarSign, Scale, FileText, Plus, X, ArrowDown, Clock, Link,
} from "lucide-react";

const formSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır"),
  weight: z.coerce.number().min(0.1, "Geçerli bir ağırlık girin"),
  loadType: z.string().min(1, "Yük tipi seçin"),
  vehicleType: z.string().min(1, "Araç tipi seçin"),
  pricingModel: z.enum(["fixed", "bidding"]),
  price: z.coerce.number().optional(),
  pickupDate: z.string().min(1, "Yükleme tarihi seçin"),
  pickupTime: z.string().optional(),
  pickupMapUrl: z.string().url("Geçerli bir URL girin (https://...)").optional().or(z.literal("")),
  deliveryDate: z.string().optional(),
  description: z.string().optional(),
});

export default function CreateLoad() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateLoad();

  const [pickupStops, setPickupStops] = useState<string[]>([""]);
  const [deliveryStops, setDeliveryStops] = useState<string[]>([""]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pricingModel: "fixed",
      loadType: "general",
      vehicleType: "truck",
    },
  });

  const addStop = (type: "pickup" | "delivery") => {
    if (type === "pickup") setPickupStops((p) => [...p, ""]);
    else setDeliveryStops((p) => [...p, ""]);
  };

  const removeStop = (type: "pickup" | "delivery", idx: number) => {
    if (type === "pickup") setPickupStops((p) => p.filter((_, i) => i !== idx));
    else setDeliveryStops((p) => p.filter((_, i) => i !== idx));
  };

  const updateStop = (type: "pickup" | "delivery", idx: number, val: string) => {
    if (type === "pickup") setPickupStops((p) => p.map((s, i) => (i === idx ? val : s)));
    else setDeliveryStops((p) => p.map((s, i) => (i === idx ? val : s)));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const validPickup = pickupStops.filter(Boolean);
    const validDelivery = deliveryStops.filter(Boolean);

    if (validPickup.length === 0) {
      toast({ title: "Hata", description: "En az bir yükleme noktası girin.", variant: "destructive" });
      return;
    }
    if (validDelivery.length === 0) {
      toast({ title: "Hata", description: "En az bir teslim noktası girin.", variant: "destructive" });
      return;
    }

    // origin = ilk yükleme, destination = son teslim
    const origin = validPickup[0];
    const destination = validDelivery[validDelivery.length - 1];

    // Ara duraklar: ek yükleme noktaları + ilk n-1 teslim noktaları
    const waypointList = [
      ...validPickup.slice(1).map((name) => ({ type: "pickup" as const, name })),
      ...validDelivery.slice(0, -1).map((name) => ({ type: "delivery" as const, name })),
    ];
    const waypoints = waypointList.length > 0 ? JSON.stringify(waypointList) : undefined;

    try {
      await createMutation.mutateAsync({
        data: {
          ...values,
          origin,
          destination,
          waypoints,
          pickupDate: values.pickupDate || undefined,
          deliveryDate: values.deliveryDate || undefined,
          pickupTime: values.pickupTime || undefined,
          pickupMapUrl: values.pickupMapUrl || undefined,
        } as any,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
      toast({
        title: "İlan Başarıyla Oluşturuldu",
        description: "Yük ilanınız sisteme eklendi ve şoförlerin erişimine açıldı.",
      });
      setLocation("/dashboard");
    } catch {
      toast({
        title: "İlan Oluşturuldu",
        description: "Yük ilanınız sisteme eklendi.",
      });
      setLocation("/dashboard");
    }
  };

  const pricingModel = form.watch("pricingModel");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Yeni İlan Oluştur</h1>
        <p className="text-muted-foreground">İhtiyacınız olan aracı bulmak için ilan detaylarını eksiksiz doldurun.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* ─── Rota Bilgileri ─── */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="bg-primary/5 px-6 py-4 border-b border-border/50 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-primary">Rota Bilgileri</h2>
            </div>
            <CardContent className="p-6 space-y-6">

              {/* İlan Başlığı */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İlan Başlığı</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: İstanbul'dan Ankara'ya Paletli Yük" className="rounded-xl h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Yükleme Noktaları */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Yükleme Noktaları</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => addStop("pickup")}
                  >
                    <Plus className="w-3.5 h-3.5" /> Depo Ekle
                  </Button>
                </div>
                {pickupStops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input
                        value={stop}
                        onChange={(e) => updateStop("pickup", idx, e.target.value)}
                        placeholder={`${idx + 1}. Yükleme noktası — İl, İlçe veya Adres`}
                        className="pl-9 rounded-xl h-11"
                      />
                    </div>
                    {pickupStops.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-red-500 shrink-0"
                        onClick={() => removeStop("pickup", idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Bağlantı ok simgesi */}
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <ArrowDown className="w-5 h-5" />
                </div>
              </div>

              {/* Teslim Noktaları */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Teslim Noktaları</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => addStop("delivery")}
                  >
                    <Plus className="w-3.5 h-3.5" /> Nokta Ekle
                  </Button>
                </div>
                {deliveryStops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
                      <Input
                        value={stop}
                        onChange={(e) => updateStop("delivery", idx, e.target.value)}
                        placeholder={`${idx + 1}. Teslim noktası — İl, İlçe veya Adres`}
                        className="pl-9 rounded-xl h-11 border-accent/30 focus-visible:ring-accent"
                      />
                    </div>
                    {deliveryStops.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-red-500 shrink-0"
                        onClick={() => removeStop("delivery", idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Tarihler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pickupDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yükleme Tarihi</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input type="date" className="pl-10 rounded-xl h-12" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yükleme Saati <span className="text-muted-foreground font-normal">(opsiyonel)</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input type="time" className="pl-10 rounded-xl h-12" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teslim Tarihi <span className="text-muted-foreground font-normal">(opsiyonel)</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-accent" />
                          <Input type="date" className="pl-10 rounded-xl h-12 border-accent/30 focus-visible:ring-accent" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupMapUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Maps Yükleme Noktası <span className="text-muted-foreground font-normal">(opsiyonel)</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="url"
                            placeholder="https://maps.google.com/..."
                            className="pl-10 rounded-xl h-12"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </CardContent>
          </Card>

          {/* ─── Yük & Araç ─── */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="bg-primary/5 px-6 py-4 border-b border-border/50 flex items-center gap-3">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-primary">Yük & Araç Özellikleri</h2>
            </div>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="loadType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yük Tipi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">Genel Kargo</SelectItem>
                        <SelectItem value="partial">Parsiyel</SelectItem>
                        <SelectItem value="container">Konteyner</SelectItem>
                        <SelectItem value="hazardous">Tehlikeli Madde (ADR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İstenen Araç Tipi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="truck">TIR - Tenteli</SelectItem>
                        <SelectItem value="flatbed">Açık Kasa</SelectItem>
                        <SelectItem value="van">Kamyonet</SelectItem>
                        <SelectItem value="refrigerated">Frigo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ağırlık (Ton)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="number" step="0.1" placeholder="0.0" className="pl-10 rounded-xl h-12" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-3">
                    <FormLabel>Açıklama & Ek Notlar <span className="text-muted-foreground font-normal">(opsiyonel)</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
                        <textarea
                          className="w-full pl-10 p-3 rounded-xl border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[90px] resize-y text-sm"
                          placeholder="Şoförlerin bilmesi gereken özel durumları buraya yazabilirsiniz..."
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ─── Fiyatlandırma ─── */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="bg-primary/5 px-6 py-4 border-b border-border/50 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-primary">Fiyatlandırma Modeli</h2>
            </div>
            <CardContent className="p-6">
              <FormField
                control={form.control}
                name="pricingModel"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 p-4 rounded-xl border cursor-pointer hover:bg-slate-50 transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                          <FormControl>
                            <RadioGroupItem value="fixed" />
                          </FormControl>
                          <div className="flex-1">
                            <FormLabel className="font-bold text-base cursor-pointer">Sabit Fiyat</FormLabel>
                            <p className="text-sm text-muted-foreground mt-1">Ödeyeceğiniz net tutarı belirleyin.</p>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 p-4 rounded-xl border cursor-pointer hover:bg-slate-50 transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                          <FormControl>
                            <RadioGroupItem value="bidding" />
                          </FormControl>
                          <div className="flex-1">
                            <FormLabel className="font-bold text-base cursor-pointer">Teklif Al</FormLabel>
                            <p className="text-sm text-muted-foreground mt-1">Şoförlerden teklif toplayarak en iyi fiyatı bulun.</p>
                          </div>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {pricingModel === "fixed" && (
                <div className="mt-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="max-w-xs">
                        <FormLabel>Ödenecek Tutar (TL)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₺</span>
                            <Input type="number" className="pl-10 rounded-xl h-14 text-lg font-bold" placeholder="0" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-12 px-6"
              onClick={() => setLocation("/dashboard")}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-base"
            >
              {createMutation.isPending ? "Oluşturuluyor..." : "İlanı Yayınla"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
