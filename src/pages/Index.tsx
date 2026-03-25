import { OrionLayout } from "@/components/OrionLayout";
import { SystemPulse } from "@/components/home/SystemPulse";
import { AttentionRequired } from "@/components/home/AttentionRequired";
import { ActiveSessions } from "@/components/home/ActiveSessions";
import { AgentsOverview } from "@/components/home/AgentsOverview";
import { OperationalHealth } from "@/components/home/OperationalHealth";
import { ExecutiveBriefing } from "@/components/home/ExecutiveBriefing";

const Index = () => {
  return (
    <OrionLayout title="Command">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          <span>Mission Control</span>
          <span className="text-border">/</span>
          <span className="text-foreground">Overview</span>
        </div>

        {/* 1. System Pulse — estado geral rápido */}
        <SystemPulse />

        {/* 2. Atenção necessária — o que exige ação */}
        <AttentionRequired />

        {/* 3. Two-column: Sessions + Agents */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ActiveSessions />
          <AgentsOverview />
        </div>

        {/* 4. Two-column: Health + Briefing */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <OperationalHealth />
          <ExecutiveBriefing />
        </div>
      </div>
    </OrionLayout>
  );
};

export default Index;
