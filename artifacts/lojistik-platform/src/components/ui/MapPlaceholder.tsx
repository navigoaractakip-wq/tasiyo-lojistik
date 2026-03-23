import { MapPin, Truck, Navigation2 } from "lucide-react";
import { motion } from "framer-motion";

interface MapPlaceholderProps {
  className?: string;
  origin?: string;
  destination?: string;
  showVehicle?: boolean;
}

export function MapPlaceholder({ className = "", origin = "İstanbul", destination = "Ankara", showVehicle = true }: MapPlaceholderProps) {
  return (
    <div className={`relative bg-slate-100 rounded-2xl overflow-hidden border border-border flex items-center justify-center ${className}`}>
      {/* Background Image/Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Route Line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <motion.path
          d="M 20% 70% Q 50% 20% 80% 30%"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          strokeDasharray="8 8"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>

      {/* Origin Marker */}
      <div className="absolute left-[20%] top-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md shadow-lg mb-1 whitespace-nowrap">
          {origin}
        </div>
        <div className="h-4 w-4 bg-primary rounded-full border-4 border-white shadow-md relative">
          <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75"></div>
        </div>
      </div>

      {/* Destination Marker */}
      <div className="absolute left-[80%] top-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-md shadow-lg mb-1 whitespace-nowrap">
          {destination}
        </div>
        <MapPin className="h-8 w-8 text-accent drop-shadow-md" fill="currentColor" />
      </div>

      {/* Moving Vehicle */}
      {showVehicle && (
        <motion.div 
          className="absolute z-10"
          initial={{ left: "20%", top: "70%" }}
          animate={{ left: "55%", top: "35%" }}
          transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        >
          <div className="bg-white p-2 rounded-full shadow-xl border-2 border-primary transform -translate-x-1/2 -translate-y-1/2">
            <Truck className="h-5 w-5 text-primary" />
          </div>
        </motion.div>
      )}
      
      {/* Overlay controls to make it look like a real map */}
      <div className="absolute right-4 bottom-4 flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow-md border border-border p-1 flex flex-col">
          <button className="p-2 hover:bg-gray-100 rounded text-gray-700">+</button>
          <div className="h-px bg-gray-200 mx-1"></div>
          <button className="p-2 hover:bg-gray-100 rounded text-gray-700">-</button>
        </div>
        <button className="bg-white rounded-lg shadow-md border border-border p-2 hover:bg-gray-100 text-primary">
          <Navigation2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
