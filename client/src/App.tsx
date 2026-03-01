import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
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
import FounderOnboarding from "@/pages/founder-onboarding";
import EvaluationPage from "@/pages/founder/evaluation";
import StartupInfoPage from "@/pages/founder/startup-info";
import ProfileInfoPage from "@/pages/founder/profile-info";
import NotFound from "@/pages/not-found";

import Analytics from "@/pages/analytics";
import Reports from "@/pages/reports";

function RootRedirect() {
  const { data: authData, isLoading } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const { data: startup, isLoading: isStartupLoading } = useQuery<any>({
    queryKey: ["/api/startups/me"],
    enabled: !!authData?.user && authData.user.role === 'founder'
  });

  if (isLoading || isStartupLoading) return null;
  const user = authData?.user;

  if (!user) return <Login />;
  if (user.role === 'admin') return <Dashboard />;
  if (user.role === 'founder') {
    return startup ? <EvaluationPage /> : <FounderOnboarding />;
  }
  return <JuryDashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/setup-password" component={SetupPassword} />
      <Route path="/login" component={Login} />
      <Route path="/" component={RootRedirect} />
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
      <Route path="/founder/evaluation">
        <ProtectedRoute>
          <EvaluationPage />
        </ProtectedRoute>
      </Route>
      <Route path="/founder/startup">
        <ProtectedRoute>
          <StartupInfoPage />
        </ProtectedRoute>
      </Route>
      <Route path="/founder/profile">
        <ProtectedRoute>
          <ProfileInfoPage />
        </ProtectedRoute>
      </Route>
      <Route path="/founder-onboarding">
        <ProtectedRoute>
          <FounderOnboarding />
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
