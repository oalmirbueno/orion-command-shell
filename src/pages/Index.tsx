import { OrionLayout } from "@/components/OrionLayout";
import { CommandStatus } from "@/components/home/CommandStatus";
import { AttentionRequired } from "@/components/home/AttentionRequired";
import { LiveOperations } from "@/components/home/LiveOperations";
import { AgentsHierarchy } from "@/components/home/AgentsHierarchy";
import { OperationalHealth } from "@/components/home/OperationalHealth";
import { ExecutiveBriefing } from "@/components/home/ExecutiveBriefing";

const Index = () => {
  return (
    <OrionLayout title="Comando">
      <div className="space-y-5">
        {/* Tier 1: Overall status */}
        <CommandStatus />

        {/* Tier 2: What needs attention */}
        <AttentionRequired />

        {/* Tier 3: Live operations + agents */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className="xl:col-span-3">
            <LiveOperations />
          </div>
          <div className="xl:col-span-2">
            <AgentsHierarchy />
          </div>
        </div>

        {/* Tier 4: Context — health + briefing */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className="xl:col-span-2">
            <OperationalHealth />
          </div>
          <div className="xl:col-span-3">
            <ExecutiveBriefing />
          </div>
        </div>
      </div>
    </OrionLayout>
  );
};

export default Index;
