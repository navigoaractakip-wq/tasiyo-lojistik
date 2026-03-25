import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { PlatformProvider } from "@/lib/platform-context";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

// Auth
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import Register from "@/pages/Register";

// Admin
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminLoads from "@/pages/admin/AdminLoads";
import AdminStats from "@/pages/admin/AdminStats";
import AdminSystem from "@/pages/admin/AdminSystem";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminContracts from "@/pages/admin/AdminContracts";

// Corporate
import CorporateDashboard from "@/pages/corporate/CorporateDashboard";
import CreateLoad from "@/pages/corporate/CreateLoad";
import EditLoad from "@/pages/corporate/EditLoad";
import CorporateOffers from "@/pages/corporate/CorporateOffers";
import CorporateTracking from "@/pages/corporate/CorporateTracking";
import CorporateTeam from "@/pages/corporate/CorporateTeam";
import CorporateSettings from "@/pages/corporate/CorporateSettings";

// Driver
import DriverFeed from "@/pages/driver/DriverFeed";
import DriverLoads from "@/pages/driver/DriverLoads";
import DriverMap from "@/pages/driver/DriverMap";
import DriverTracking from "@/pages/driver/DriverTracking";
import DriverOffers from "@/pages/driver/DriverOffers";

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Array<"admin" | "corporate" | "driver">;
}) {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !role) {
    return <Redirect to="/giris" />;
  }

  if (allowedRoles && !allowedRoles.includes(role as any)) {
    const target =
      role === "admin" ? "/admin" : role === "corporate" ? "/dashboard" : "/driver";
    return <Redirect to={target} />;
  }

  return <>{children}</>;
}

function Router() {
  const { user, role, isLoading } = useAuth();

  return (
    <Switch>
      {/* Auth */}
      <Route path="/giris" component={Login} />
      <Route path="/admingiris" component={AdminLogin} />
      <Route path="/kayit" component={Register} />

      {/* Root redirect */}
      <Route path="/">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : user && role ? (
          <Redirect to={role === "admin" ? "/admin" : role === "corporate" ? "/dashboard" : "/driver"} />
        ) : (
          <Redirect to="/giris" />
        )}
      </Route>

      {/* ── Admin Routes ── */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AppLayout><AdminDashboard /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AppLayout><AdminUsers /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/loads">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AppLayout><AdminLoads /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/stats">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AppLayout><AdminStats /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/system">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AppLayout><AdminSystem /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AppLayout><AdminSettings /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/sozlesmeler">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AppLayout><AdminContracts /></AppLayout>
        </ProtectedRoute>
      </Route>

      {/* ── Corporate Routes ── */}
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={["corporate"]}>
          <AppLayout><CorporateDashboard /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/create-load">
        <ProtectedRoute allowedRoles={["corporate"]}>
          <AppLayout><CreateLoad /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/edit-load/:id">
        <ProtectedRoute allowedRoles={["corporate"]}>
          <AppLayout><EditLoad /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/offers">
        <ProtectedRoute allowedRoles={["corporate"]}>
          <AppLayout><CorporateOffers /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/tracking">
        <ProtectedRoute allowedRoles={["corporate"]}>
          <AppLayout><CorporateTracking /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/team">
        <ProtectedRoute allowedRoles={["corporate"]}>
          <AppLayout><CorporateTeam /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/settings">
        <ProtectedRoute allowedRoles={["corporate"]}>
          <AppLayout><CorporateSettings /></AppLayout>
        </ProtectedRoute>
      </Route>

      {/* ── Driver Routes ── */}
      <Route path="/driver">
        <ProtectedRoute allowedRoles={["driver"]}>
          <AppLayout><DriverFeed /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/driver/loads">
        <ProtectedRoute allowedRoles={["driver"]}>
          <AppLayout><DriverLoads /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/driver/map">
        <ProtectedRoute allowedRoles={["driver"]}>
          <AppLayout><DriverMap /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/driver/tracking">
        <ProtectedRoute allowedRoles={["driver"]}>
          <AppLayout><DriverTracking /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/driver/offers">
        <ProtectedRoute allowedRoles={["driver"]}>
          <AppLayout><DriverOffers /></AppLayout>
        </ProtectedRoute>
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PlatformProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </WouterRouter>
        </PlatformProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
