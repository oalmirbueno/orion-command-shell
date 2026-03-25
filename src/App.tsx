import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import PlaceholderPage from "./pages/PlaceholderPage.tsx";
import SystemPage from "./pages/SystemPage.tsx";
import AgentsPage from "./pages/AgentsPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/missions" element={<PlaceholderPage title="Missions" description="Mission tracking and orchestration" />} />
          <Route path="/telemetry" element={<PlaceholderPage title="Telemetry" description="Real-time system telemetry" />} />
          <Route path="/comms" element={<PlaceholderPage title="Comms" description="Communications hub" />} />
          <Route path="/system" element={<SystemPage />} />
          <Route path="/pipelines" element={<PlaceholderPage title="Pipelines" description="Data pipeline management" />} />
          <Route path="/automations" element={<PlaceholderPage title="Automations" description="Automation workflows" />} />
          <Route path="/security" element={<PlaceholderPage title="Security" description="Security monitoring and controls" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" description="System configuration" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
