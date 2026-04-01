import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LastUpdatedProvider } from "@/hooks/useLastUpdated";
import { DomainHealthProvider } from "@/hooks/useDomainHealth";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useOrionStream } from "@/hooks/useOrionStream";
import Index from "./pages/Index.tsx";
import PlaceholderPage from "./pages/PlaceholderPage.tsx";
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
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute><AgentsPage /></ProtectedRoute>} />
            <Route path="/missions" element={<ProtectedRoute><MissionsPage /></ProtectedRoute>} />
            <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
            <Route path="/memory" element={<ProtectedRoute><MemoryPage /></ProtectedRoute>} />
            <Route path="/system" element={<ProtectedRoute><SystemPage /></ProtectedRoute>} />
            <Route path="/cron" element={<ProtectedRoute><CronPage /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
            <Route path="/operations" element={<ProtectedRoute><OperationsPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/skills" element={<ProtectedRoute><SkillsPage /></ProtectedRoute>} />
            <Route path="/builders" element={<ProtectedRoute><BuildersPage /></ProtectedRoute>} />
            <Route path="/timeline" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
            <Route path="/pipelines" element={<ProtectedRoute><PipelinesPage /></ProtectedRoute>} />
            <Route path="/office3d" element={<ProtectedRoute><Office3DPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
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
