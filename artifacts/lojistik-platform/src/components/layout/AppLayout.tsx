import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { usePlatformBranding } from "@/lib/platform-context";
import { 
  LayoutDashboard, Package, Truck, Users, 
  MessageSquare, Settings, Bell, LogOut, 
  Menu, X, ShieldAlert, BarChart3, Map,
  Search, FileText, ScrollText, HeadphonesIcon
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { role, logout, user } = useAuth();
  const branding = usePlatformBranding();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If no role is selected, don't show the layout (Gateway page handles it)
  if (!role) return <>{children}</>;

  // Driver uses a mobile-first bottom navigation layout
  if (role === "driver") {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center">
        {/* Phone-shell card: on mobile fills screen, on larger screens is centered max-w-md */}
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl overflow-x-hidden relative flex flex-col">
          <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="h-8 w-8 object-contain" />
              <span className="font-display font-bold text-lg text-primary">TaşıYo</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/driver/destek">
                <Button variant="ghost" size="sm" className="text-xs text-gray-600 gap-1 px-2 h-8">
                  <HeadphonesIcon className="h-4 w-4" />
                  <span className="hidden xs:inline">Destek</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8">
                <Bell className="h-4 w-4 text-gray-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full border-2 border-white"></span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 border border-border cursor-pointer">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : "SF"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <div className="px-3 py-2 border-b">
                    <p className="text-xs font-semibold truncate">{user?.name ?? "Şoför"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.phone ?? user?.email ?? ""}</p>
                  </div>
                  <DropdownMenuItem onClick={logout} className="text-red-600 gap-2 cursor-pointer">
                    <LogOut className="w-4 h-4" /> Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Scrollable content area, clears the fixed bottom nav */}
          <main className="flex-1 overflow-y-auto pb-20">
            {children}
          </main>

          {/* Bottom nav: fixed but centered to align with the max-w-md shell */}
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex justify-around items-center pt-2 pb-3 px-2 z-50">
            <DriverNavItem href="/driver" icon={HomeIcon} label="Ana Sayfa" active={location === "/driver"} />
            <DriverNavItem href="/driver/loads" icon={Search} label="Yükler" active={location === "/driver/loads"} />
            <div className="relative -top-5">
              <Link href="/driver/map" className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-accent to-orange-400 text-white shadow-lg shadow-accent/40 active:scale-95 transition-transform">
                <Map className="h-6 w-6" />
              </Link>
            </div>
            <DriverNavItem href="/driver/offers" icon={FileText} label="Tekliflerim" active={location === "/driver/offers"} />
            <DriverNavItem href="/driver/tracking" icon={Truck} label="Takip" active={location === "/driver/tracking"} />
          </nav>
        </div>
      </div>
    );
  }

  // Admin & Corporate Desktop Layout
  const links = role === "admin" ? [
    { href: "/admin", label: "Kontrol Paneli", icon: LayoutDashboard },
    { href: "/admin/loads", label: "İlan Yönetimi", icon: Package },
    { href: "/admin/users", label: "Kullanıcılar", icon: Users },
    { href: "/admin/stats", label: "Raporlar", icon: BarChart3 },
    { href: "/admin/destek", label: "Destek Talepleri", icon: HeadphonesIcon },
    { href: "/admin/sozlesmeler", label: "Sözleşmeler", icon: ScrollText },
    { href: "/admin/system", label: "Sistem", icon: ShieldAlert },
    { href: "/admin/settings", label: "Ayarlar", icon: Settings },
  ] : [
    { href: "/dashboard", label: "Kontrol Paneli", icon: LayoutDashboard },
    { href: "/dashboard/create-load", label: "Yük Ver", icon: Package },
    { href: "/dashboard/offers", label: "Teklifler", icon: MessageSquare },
    { href: "/dashboard/tracking", label: "Canlı Takip", icon: Truck },
    { href: "/dashboard/team", label: "Ekibim", icon: Users },
    { href: "/dashboard/destek", label: "Destek", icon: HeadphonesIcon },
    { href: "/dashboard/settings", label: "Ayarlar", icon: Settings },
  ];

  const supportHref = role === "admin" ? "/admin/destek" : "/dashboard/destek";

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-sidebar text-sidebar-foreground border-b border-sidebar-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {branding.logo ? (
            <img src={branding.logo} alt="Logo" className="h-8 w-8 object-contain rounded-md bg-white/15 p-0.5" />
          ) : (
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="h-8 w-8 brightness-0 invert" />
          )}
          <span className="font-display font-bold text-xl">{branding.name}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground 
        border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 hidden md:flex items-center gap-3">
          {branding.logo ? (
            <img src={branding.logo} alt="Logo" className="h-10 w-10 object-contain rounded-lg bg-white/15 p-0.5" />
          ) : (
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="h-10 w-10 brightness-0 invert" />
          )}
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight text-white leading-none">{branding.name}</h1>
            <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest font-semibold">Lojistik Platformu</span>
          </div>
        </div>

        <div className="px-6 pb-4">
          <Badge variant="outline" className="w-full justify-center bg-sidebar-border border-sidebar-border/50 text-white/80 py-1">
            {role === "admin" ? "Süper Yönetici" : "Kurumsal Kullanıcı"}
          </Badge>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
                  ${isActive 
                    ? 'bg-sidebar-primary text-white shadow-lg shadow-sidebar-primary/20' 
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-border hover:text-white'}
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-sidebar-foreground/50'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-3 mb-4">
            <Avatar className="h-10 w-10 border border-sidebar-border">
              <AvatarImage src={user?.avatarUrl ?? ""} />
              <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary">
                {user?.name?.slice(0, 2).toUpperCase() ?? (role === "admin" ? "AD" : "KR")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name ?? (role === "admin" ? "Admin User" : "Kurumsal")}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email ?? user?.phone ?? ""}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Çıkış Yap
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold font-display text-foreground hidden lg:block">
              {links.find(l => l.href === location)?.label || "Kontrol Paneli"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Link href={supportHref}>
              <Button variant="outline" className="hidden lg:flex border-border bg-background shadow-sm hover:border-primary/50">
                <HeadphonesIcon className="h-4 w-4 mr-2 text-primary" />
                Destek
              </Button>
            </Link>
            <Button variant="outline" size="icon" className="relative rounded-full border-border bg-background shadow-sm hover:border-primary/50">
              <Bell className="h-5 w-5 text-foreground/80" />
              <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-accent rounded-full border-2 border-background"></span>
            </Button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

function HomeIcon(props: any) {
  return <LayoutDashboard {...props} />;
}

function DriverNavItem({ href, icon: Icon, label, active, onClick }: any) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-1 w-16">
      <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-gray-500'}`}>
        <Icon className={`h-5 w-5 ${active ? 'fill-primary/20' : ''}`} />
      </div>
      <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-gray-500'}`}>{label}</span>
    </div>
  );

  if (onClick) {
    return <button onClick={onClick} className="focus:outline-none">{content}</button>;
  }

  return <Link href={href}>{content}</Link>;
}
