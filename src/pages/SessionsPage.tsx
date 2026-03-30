import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { SessionsSummary } from "@/components/sessions/SessionsSummary";
import { SessionsList } from "@/components/sessions/SessionsList";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchSessions } from "@/domains/sessions/fetcher";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { SessionsSkeleton } from "@/components/skeletons/DomainSkeletons";
import type { SessionView } from "@/domains/sessions/types";

const SessionsPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<SessionView[]>({
    key: "sessions",
    fetcher: fetchSessions,
    refreshInterval: 30_000,
  });

  const sessions = data || [];

  return (
    <OrionLayout title="Sessões">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Sessões"]} />
        <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} emptyTitle="Nenhuma sessão encontrada" emptyDescription="Sessões aparecerão aqui quando agentes estiverem ativos" skeleton={<SessionsSkeleton />}>
          <SessionsSummary sessions={sessions} />
          <div className="mt-8">
            <SessionsList sessions={sessions} />
          </div>
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default SessionsPage;
