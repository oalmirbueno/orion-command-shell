import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LastUpdatedProvider } from "@/hooks/useLastUpdated";
import { useOrionStream } from "@/hooks/useOrionStream";
import Index from "./pages/Index.tsx";
import PlaceholderPage from "./pages/PlaceholderPage.tsx";
import SystemPage from "./pages/SystemPage.tsx";
import AgentsPage from "./pages/AgentsPage.tsx";
import SessionsPage from "./pages/SessionsPage.tsx";
import ActivityPage from "./pages/ActivityPage.tsx";
import CronPage from "./pages/CronPage.tsx";
import MemoryPage from "./pages/MemoryPage.tsx";
import AlertsPage from "./pages/AlertsPage.tsx";
import Office3DPage from "./pages/Office3DPage.tsx";
import OperationsPage from "./pages/OperationsPage.tsx";
import FilesPage from "./pages/FilesPage.tsx";
import SearchPage from "./pages/SearchPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { PageTransition } from "./components/PageTransition.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/** Inner component to use hooks inside QueryClientProvider */
function AppShell() {
  // SSE real-time stream — injects data into React Query cache
  useOrionStream();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/missions" element={<PlaceholderPage title="Missões" description="Rastreamento e orquestração de missões" />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/memory" element={<MemoryPage />} />
            <Route path="/system" element={<SystemPage />} />
            <Route path="/cron" element={<CronPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/pipelines" element={<PlaceholderPage title="Pipelines" description="Módulo Pipeline — Em desenvolvimento" />} />
            <Route path="/office3d" element={<Office3DPage />} />
            <Route path="/settings" element={<PlaceholderPage title="Configurações" description="Módulo Configurações — Em desenvolvimento" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LastUpdatedProvider>
      <DomainHealthProvider>
        <TooltipProvider>
          <AppShell />
        </TooltipProvider>
      </DomainHealthProvider>
    </LastUpdatedProvider>
  </QueryClientProvider>
);

export default App;
