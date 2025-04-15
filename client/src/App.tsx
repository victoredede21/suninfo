import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AgentProvider } from "@/context/agent-context";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Agents from "@/pages/agents";
import AgentDetails from "@/pages/agent-details";
import Screenshots from "@/pages/screenshots";
import Commands from "@/pages/commands";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/agents" component={Agents} />
      <Route path="/agents/:id" component={AgentDetails} />
      <Route path="/screenshots" component={Screenshots} />
      <Route path="/commands" component={Commands} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AgentProvider>
        <Router />
        <Toaster />
      </AgentProvider>
    </QueryClientProvider>
  );
}

export default App;
