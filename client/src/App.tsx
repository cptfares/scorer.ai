import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Startups from "@/pages/startups";
import Jury from "@/pages/jury";
import Evaluations from "@/pages/evaluations";
import EvaluationForm from "@/pages/evaluation-form";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/startups" component={Startups} />
      <Route path="/jury" component={Jury} />
      <Route path="/evaluations" component={Evaluations} />
      <Route path="/evaluate/:startupId" component={EvaluationForm} />
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
