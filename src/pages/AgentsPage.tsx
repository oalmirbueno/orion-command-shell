import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { AgentsSummaryBar } from "@/components/agents/AgentsSummaryBar";
import { AgentArchitectureMap } from "@/components/agents/AgentArchitectureMap";
import { AgentDetailCards } from "@/components/agents/AgentDetailCards";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchAgents } from "@/domains/agents/fetcher";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import type { Agent } from "@/domains/agents/types";

const AgentsPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<Agent[]>({
    key: "agents",
    fetcher: fetchAgents,
  });

  const agents = data || [];

  return (
    <OrionLayout title="Agentes">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Agentes"]} />
        <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch}>
          <AgentsSummaryBar agents={agents} />
          <div className="mt-8">
            <AgentArchitectureMap agents={agents} />
          </div>
          <div className="mt-8">
            <AgentDetailCards agents={agents} />
          </div>
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default AgentsPage;
