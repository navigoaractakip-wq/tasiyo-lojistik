import type { Role } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Building2, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function Gateway() {
  const [, setLocation] = useLocation();

  const handleSelectRole = (_role: Role, path: string) => {
    setLocation(path);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-map.png`}
          alt="Logistics Network"
          className="w-full h-full object-cover opacity-[0.15]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      <div className="relative z-10 max-w-5xl w-full mx-auto flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="h-16 w-16" />
            <h1 className="text-5xl font-display font-extrabold tracking-tight text-primary">Taşı<span className="text-accent">Yo</span></h1>
          </div>
          <h2 className="text-2xl font-medium text-foreground mb-3">Yeni Nesil Lojistik Platformu</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Giriş yapmak istediğiniz demo rolünü seçin. Her rol farklı bir arayüz ve özellik setine sahiptir.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Admin Role */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-8 h-full flex flex-col items-center text-center hover:border-primary hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer group bg-white/80 backdrop-blur-sm"
                  onClick={() => handleSelectRole("admin", "/admin")}>
              <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-display">Süper Yönetici</h3>
              <p className="text-sm text-muted-foreground mb-8 flex-1">
                Platform istatistiklerini gör, kullanıcıları ve ilanları yönet, onay işlemlerini gerçekleştir.
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl" size="lg">
                Yönetici Girişi
              </Button>
            </Card>
          </motion.div>

          {/* Corporate Role */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-8 h-full flex flex-col items-center text-center hover:border-primary hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer group bg-white/80 backdrop-blur-sm relative overflow-hidden"
                  onClick={() => handleSelectRole("corporate", "/dashboard")}>
              <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                En Popüler
              </div>
              <div className="h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                <Building2 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-display">Kurumsal Kullanıcı</h3>
              <p className="text-sm text-muted-foreground mb-8 flex-1">
                Yük ilanları oluştur, teklifleri değerlendir, araçları haritadan canlı takip et.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl text-white shadow-lg shadow-blue-600/20" size="lg">
                Kurumsal Giriş
              </Button>
            </Card>
          </motion.div>

          {/* Driver Role */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="p-8 h-full flex flex-col items-center text-center hover:border-accent hover:shadow-2xl hover:shadow-accent/10 transition-all duration-300 cursor-pointer group bg-white/80 backdrop-blur-sm"
                  onClick={() => handleSelectRole("driver", "/driver")}>
              <div className="h-20 w-20 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all">
                <Truck className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-display">Şoför / Bireysel</h3>
              <p className="text-sm text-muted-foreground mb-8 flex-1">
                Mobil görünümlü uygulama üzerinden sana uygun yükleri bul, teklif ver ve kazan.
              </p>
              <Button className="w-full bg-accent hover:bg-accent/90 rounded-xl text-white shadow-lg shadow-accent/20" size="lg">
                Şoför Girişi
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
