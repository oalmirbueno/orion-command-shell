import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { AgentsSummaryBar } from "@/components/agents/AgentsSummaryBar";
import { AgentArchitectureMap } from "@/components/agents/AgentArchitectureMap";
import { AgentDetailCards } from "@/components/agents/AgentDetailCards";

const AgentsPage = () => {
  return (
    <OrionLayout title="Agentes">
      <div className="max-w-7xl mx-auto space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Agentes"]} />
        <AgentsSummaryBar />
        <AgentArchitectureMap />
        <AgentDetailCards />
      </div>
    </OrionLayout>
  );
};

export default AgentsPage;
