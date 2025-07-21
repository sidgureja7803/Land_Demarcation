import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import CitizenDashboard from "@/pages/citizen-dashboard";
import OfficerDashboard from "@/pages/officer-dashboard";
import Plots from "@/pages/plots";
import NewLog from "@/pages/new-log";
import History from "@/pages/history";
import PlotMapView from "@/pages/plot-map-view";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, isCitizen, hasAdminAccess } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="*" component={Landing} />
      </Switch>
    );
  }

  // Citizen routes (application submission, tracking, etc.)
  if (isCitizen) {
    return (
      <Switch>
        <Route path="/">
          {() => <CitizenDashboard />}
        </Route>
        <Route path="/apply">
          {() => <NewLog userType="citizen" />}
        </Route>
        <Route path="/applications">
          {() => <History userType="citizen" />}
        </Route>
        <Route path="/map">
          {() => <PlotMapView userType="citizen" />}
        </Route>
        <Route>
          {() => <NotFound />}
        </Route>
      </Switch>
    );
  }

  // Officer and admin routes
  return (
    <Switch>
      <Route path="/">
        {() => <OfficerDashboard />}
      </Route>
      <Route path="/plots">
        {() => <Plots />}
      </Route>
      <Route path="/map">
        {() => <PlotMapView userType={hasAdminAccess ? "admin" : "officer"} />}
      </Route>
      <Route path="/new-log">
        {() => <NewLog userType={hasAdminAccess ? "admin" : "officer"} />}
      </Route>
      <Route path="/history">
        {() => <History userType={hasAdminAccess ? "admin" : "officer"} />}
      </Route>
      {hasAdminAccess && (
        <Route path="/admin">
          {() => <Dashboard userType="admin" adminView={true} />}
        </Route>
      )}
      <Route>
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
