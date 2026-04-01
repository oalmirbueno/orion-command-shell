import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LastUpdatedProvider } from "@/hooks/useLastUpdated";
import { DomainHealthProvider } from "@/hooks/useDomainHealth";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useOrionStream } from "@/hooks/useOrionStream";
import Index from "./pages/Index.tsx";
import PipelinesPage from "./pages/PipelinesPage.tsx";
import MissionsPage from "./pages/MissionsPage.tsx";
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
import SkillsPage from "./pages/SkillsPage.tsx";
import BuildersPage from "./pages/BuildersPage.tsx";
import TimelinePage from "./pages/TimelinePage.tsx";
import RemindersPage from "./pages/RemindersPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
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

/** Wrap a page component with ErrorBoundary */
function EB({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <ProtectedRoute>
      <ErrorBoundary fallbackTitle={`Erro em ${title}`}>
        {children}
      </ErrorBoundary>
    </ProtectedRoute>
  );
}

/** Inner component to use hooks inside QueryClientProvider */
function AppShell() {
  useOrionStream();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PageTransition>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected with Error Boundaries */}
            <Route path="/" element={<EB title="Dashboard"><Index /></EB>} />
            <Route path="/agents" element={<EB title="Agentes"><AgentsPage /></EB>} />
            <Route path="/missions" element={<EB title="Missões"><MissionsPage /></EB>} />
            <Route path="/sessions" element={<EB title="Sessões"><SessionsPage /></EB>} />
            <Route path="/activity" element={<EB title="Atividade"><ActivityPage /></EB>} />
            <Route path="/memory" element={<EB title="Memória"><MemoryPage /></EB>} />
            <Route path="/system" element={<EB title="Sistema"><SystemPage /></EB>} />
            <Route path="/cron" element={<EB title="Cron"><CronPage /></EB>} />
            <Route path="/alerts" element={<EB title="Alertas"><AlertsPage /></EB>} />
            <Route path="/operations" element={<EB title="Operações"><OperationsPage /></EB>} />
            <Route path="/files" element={<EB title="Arquivos"><FilesPage /></EB>} />
            <Route path="/search" element={<EB title="Busca"><SearchPage /></EB>} />
            <Route path="/skills" element={<EB title="Skills"><SkillsPage /></EB>} />
            <Route path="/builders" element={<EB title="Builders"><BuildersPage /></EB>} />
            <Route path="/timeline" element={<EB title="Timeline"><TimelinePage /></EB>} />
            <Route path="/reminders" element={<EB title="Lembretes"><RemindersPage /></EB>} />
            <Route path="/pipelines" element={<EB title="Pipelines"><PipelinesPage /></EB>} />
            <Route path="/office3d" element={<EB title="Office 3D"><Office3DPage /></EB>} />
            <Route path="/settings" element={<EB title="Configurações"><SettingsPage /></EB>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LastUpdatedProvider>
        <DomainHealthProvider>
          <TooltipProvider>
            <AppShell />
          </TooltipProvider>
        </DomainHealthProvider>
      </LastUpdatedProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
