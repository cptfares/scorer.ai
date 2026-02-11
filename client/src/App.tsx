import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/protected-route";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Startups from "@/pages/startups";
import Jury from "@/pages/jury";
import Evaluations from "@/pages/evaluations";
import EvaluationForm from "@/pages/evaluation-form";
import JuryDashboard from "@/pages/jury-dashboard";
import SetupPassword from "@/pages/setup-password";
import NotFound from "@/pages/not-found";

import Analytics from "@/pages/analytics";
import Reports from "@/pages/reports";

function Router() {
  return (
    <Switch>
      <Route path="/setup-password" component={SetupPassword} />
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute requireAdmin>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute requireAdmin>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/startups">
        <ProtectedRoute requireAdmin>
          <Startups />
        </ProtectedRoute>
      </Route>
      <Route path="/jury">
        <ProtectedRoute requireAdmin>
          <Jury />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute requireAdmin>
          <Analytics />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute requireAdmin>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/evaluations">
        <ProtectedRoute requireAdmin>
          <Evaluations />
        </ProtectedRoute>
      </Route>
      <Route path="/jury-dashboard">
        <ProtectedRoute>
          <JuryDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/evaluate/:startupId">
        <ProtectedRoute>
          <EvaluationForm />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
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
