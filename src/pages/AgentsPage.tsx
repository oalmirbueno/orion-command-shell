import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { AgentsSummaryBar } from "@/components/agents/AgentsSummaryBar";
import { AgentsList } from "@/components/agents/AgentsList";

const AgentsPage = () => {
  return (
    <OrionLayout title="Agentes">
      <div className="max-w-7xl mx-auto space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Agentes"]} />
        <AgentsSummaryBar />
        <AgentsList />
      </div>
    </OrionLayout>
  );
};

export default AgentsPage;
