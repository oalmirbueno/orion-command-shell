import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { SessionsSummary } from "@/components/sessions/SessionsSummary";
import { SessionsList } from "@/components/sessions/SessionsList";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchSessions } from "@/domains/sessions/fetcher";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import type { Session } from "@/domains/sessions/types";

const SessionsPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<Session[]>({
    key: "sessions",
    fetcher: fetchSessions,
  });

  const sessions = data || [];

  return (
    <OrionLayout title="Sessões">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Sessões"]} />
        <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch}>
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
