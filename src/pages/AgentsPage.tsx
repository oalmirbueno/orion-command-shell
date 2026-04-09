import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { AgentsSummaryBar } from "@/components/agents/AgentsSummaryBar";
import { AgentArchitectureMap } from "@/components/agents/AgentArchitectureMap";
import { AgentDetailCards } from "@/components/agents/AgentDetailCards";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchAgents } from "@/domains/agents/fetcher";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { AgentsSkeleton } from "@/components/skeletons/DomainSkeletons";
import type { AgentView } from "@/domains/agents/types";

const AgentsPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<AgentView[]>({
    key: "agents",
    fetcher: fetchAgents,
    refreshInterval: 30_000,
  });

  const agents = data || [];
  // Dynamic: use structuralStatus/official from backend
  const officialAgents = agents.filter(a => a.official !== false && a.structuralStatus !== "legacy");
  const legacyAgents = agents.filter(a => a.official === false || a.structuralStatus === "legacy");

  return (
    <OrionLayout title="Agentes">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Agentes"]} />
        <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} emptyTitle="Nenhum agente configurado" emptyDescription="Configure agentes no backend para visualizá-los aqui" skeleton={<AgentsSkeleton />}>
          <AgentsSummaryBar agents={agents} />

          {/* Architecture Map — official only */}
          <div className="mt-8">
            <AgentArchitectureMap agents={officialAgents} />
          </div>

          {/* Official Agents Detail */}
          <div className="mt-8">
            <AgentDetailCards agents={officialAgents} />
          </div>

          {/* Legacy Agents — secondary */}
          {legacyAgents.length > 0 && (
            <div className="mt-8">
              <div className="rounded-lg border border-border/30 overflow-hidden">
                <div className="orion-panel-header">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-0.5 bg-muted-foreground/30 rounded-full" />
                    <h2 className="orion-panel-title text-muted-foreground/50">Agentes Legados</h2>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground/25">{legacyAgents.length} legados</span>
                </div>
                <div className="opacity-50">
                  <AgentDetailCards agents={legacyAgents} />
                </div>
              </div>
            </div>
          )}
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default AgentsPage;
