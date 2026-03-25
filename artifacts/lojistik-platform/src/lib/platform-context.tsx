import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface PlatformBranding {
  name: string;
  logo: string | null;
}

const DEFAULT_BRANDING: PlatformBranding = { name: "TaşıYo", logo: null };

const PlatformContext = createContext<PlatformBranding>(DEFAULT_BRANDING);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<PlatformBranding>(DEFAULT_BRANDING);

  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? "/";
    const url = `${base}api/settings/public`.replace(/\/+/g, "/").replace(":/", "://");
    fetch(url)
      .then(r => r.json())
      .then((data: { platform_name?: string | null; platform_logo?: string | null }) => {
        setBranding({
          name: data.platform_name?.trim() || "TaşıYo",
          logo: data.platform_logo || null,
        });
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  return (
    <PlatformContext.Provider value={branding}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatformBranding() {
  return useContext(PlatformContext);
}
