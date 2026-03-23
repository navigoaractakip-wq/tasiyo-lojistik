import { MapPlaceholder } from "@/components/ui/MapPlaceholder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navigation, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function DriverMap() {
  return (
    <div className="relative h-[calc(100vh-140px)] flex flex-col">
      {/* Map Area */}
      <div className="flex-1 relative">
        <MapPlaceholder className="absolute inset-0 rounded-none border-0" origin="Konumunuz" destination="Hedef Bölge" />
        
        {/* Floating UI on Map */}
        <div className="absolute top-4 left-4 right-4 flex gap-2">
          <Card className="flex-1 bg-white/90 backdrop-blur-md border-0 shadow-lg p-3 rounded-2xl flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Mevcut Konum</p>
              <p className="text-sm font-bold">İstanbul, Tuzla OSB</p>
            </div>
          </Card>
        </div>

        {/* Radar Animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div 
            className="w-48 h-48 rounded-full border-2 border-accent/40"
            animate={{ scale: [1, 2], opacity: [0.8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div 
            className="w-48 h-48 rounded-full border-2 border-accent/40 absolute top-0 left-0"
            animate={{ scale: [1, 2], opacity: [0.8, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
        </div>
      </div>

      {/* Bottom Sheet Action */}
      <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 relative z-20">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5"></div>
        
        <h2 className="text-xl font-bold font-display text-center mb-1">Çevrenizde İş Aranıyor</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Radar açık, konumunuza uygun yükler taranıyor.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
            <p className="text-2xl font-bold text-primary">14</p>
            <p className="text-xs text-gray-500 font-medium">Yakın İlan</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
            <p className="text-2xl font-bold text-accent">5 km</p>
            <p className="text-xs text-gray-500 font-medium">Tarama Yarıçapı</p>
          </div>
        </div>
        
        <Button className="w-full h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-accent to-orange-500 hover:from-orange-500 hover:to-accent shadow-xl shadow-accent/30 animate-pulse">
          <Zap className="mr-2 h-5 w-5" />
          Radarı Durdur
        </Button>
      </div>
    </div>
  );
}
