import { OrionLayout } from "@/components/OrionLayout";
import { AgentsSummaryBar } from "@/components/agents/AgentsSummaryBar";
import { AgentsList } from "@/components/agents/AgentsList";

const AgentsPage = () => {
  return (
    <OrionLayout title="Agents">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          <span>Mission Control</span>
          <span className="text-border">/</span>
          <span className="text-foreground">Agents</span>
        </div>

        <AgentsSummaryBar />
        <AgentsList />
      </div>
    </OrionLayout>
  );
};

export default AgentsPage;
