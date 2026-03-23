import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

// Pages
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSettings from "@/pages/admin/AdminSettings";
import CorporateDashboard from "@/pages/corporate/CorporateDashboard";
import CreateLoad from "@/pages/corporate/CreateLoad";
import DriverFeed from "@/pages/driver/DriverFeed";
import DriverMap from "@/pages/driver/DriverMap";

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Array<"admin" | "corporate" | "driver">;
}) {
  const { user, role, isLoading } = useAuth();
  const [location] = useLocation();

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
    const target = role === "admin" ? "/admin" : role === "corporate" ? "/dashboard" : "/driver";
    return <Redirect to={target} />;
  }

  return <>{children}</>;
}

function Router() {
  const { user, role, isLoading } = useAuth();
  const [location] = useLocation();

  return (
    <Switch>
      {/* Auth */}
      <Route path="/giris" component={Login} />

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

      {/* Admin Routes */}
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
      <Route path="/admin/settings">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AppLayout><AdminSettings /></AppLayout>
        </ProtectedRoute>
      </Route>

      {/* Corporate Routes */}
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

      {/* Driver Routes */}
      <Route path="/driver">
        <ProtectedRoute allowedRoles={["driver"]}>
          <AppLayout><DriverFeed /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/driver/loads">
        <ProtectedRoute allowedRoles={["driver"]}>
          <AppLayout><DriverFeed /></AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/driver/map">
        <ProtectedRoute allowedRoles={["driver"]}>
          <AppLayout><DriverMap /></AppLayout>
        </ProtectedRoute>
      </Route>

      {/* Placeholder for unbuilt pages within AppLayout */}
      <Route path="/:rest*">
        <ProtectedRoute>
          <AppLayout>
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <h2 className="text-2xl font-bold mb-2">Sayfa Yapım Aşamasında</h2>
              <p className="text-muted-foreground">Bu sayfa henüz tamamlanmadı.</p>
            </div>
          </AppLayout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
