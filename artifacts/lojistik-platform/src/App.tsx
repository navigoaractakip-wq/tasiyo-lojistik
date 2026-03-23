import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

// Pages
import Gateway from "@/pages/Gateway";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import CorporateDashboard from "@/pages/corporate/CorporateDashboard";
import CreateLoad from "@/pages/corporate/CreateLoad";
import DriverFeed from "@/pages/driver/DriverFeed";
import DriverMap from "@/pages/driver/DriverMap";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Gateway} />
      
      {/* Admin Routes */}
      <Route path="/admin">
        <AppLayout><AdminDashboard /></AppLayout>
      </Route>
      <Route path="/admin/users">
        <AppLayout><AdminUsers /></AppLayout>
      </Route>
      
      {/* Corporate Routes */}
      <Route path="/dashboard">
        <AppLayout><CorporateDashboard /></AppLayout>
      </Route>
      <Route path="/dashboard/create-load">
        <AppLayout><CreateLoad /></AppLayout>
      </Route>
      
      {/* Driver Routes */}
      <Route path="/driver">
        <AppLayout><DriverFeed /></AppLayout>
      </Route>
      <Route path="/driver/loads">
        <AppLayout><DriverFeed /></AppLayout>
      </Route>
      <Route path="/driver/map">
        <AppLayout><DriverMap /></AppLayout>
      </Route>

      {/* Placeholder matching for unbuilt routes within AppLayout to maintain navigation structure */}
      <Route path="/:rest*">
        <AppLayout>
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <h2 className="text-2xl font-bold mb-2">Sayfa Yapım Aşamasında</h2>
            <p className="text-muted-foreground">Bu sayfa henüz tamamlanmadı.</p>
          </div>
        </AppLayout>
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
