import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { SystemPulse } from "@/components/home/SystemPulse";
import { AttentionRequired } from "@/components/home/AttentionRequired";
import { ActiveSessions } from "@/components/home/ActiveSessions";
import { AgentsHierarchy } from "@/components/home/AgentsHierarchy";
import { OperationalHealth } from "@/components/home/OperationalHealth";
import { ExecutiveBriefing } from "@/components/home/ExecutiveBriefing";

const Index = () => {
  return (
    <OrionLayout title="Comando">
      <div className="max-w-7xl mx-auto space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Visão Geral"]} />

        <SystemPulse />
        <AttentionRequired />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ActiveSessions />
          <AgentsHierarchy />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <OperationalHealth />
          <ExecutiveBriefing />
        </div>
      </div>
    </OrionLayout>
  );
};

export default Index;
