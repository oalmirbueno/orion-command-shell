import { OrionLayout } from "@/components/OrionLayout";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { useOrionData } from "@/hooks/useOrionData";
import { HomeSkeleton } from "@/components/skeletons/DomainSkeletons";
import { fetchHomePage } from "@/domains/home/fetcher";
import type { HomePageData } from "@/domains/home/types";
import { CommandStatus } from "@/components/home/CommandStatus";
import { AttentionRequired } from "@/components/home/AttentionRequired";
import { LiveOperations } from "@/components/home/LiveOperations";
import { AgentsHierarchy } from "@/components/home/AgentsHierarchy";
import { OperationalHealth } from "@/components/home/OperationalHealth";
import { ExecutiveBriefing } from "@/components/home/ExecutiveBriefing";
import { WeatherContext } from "@/components/home/WeatherContext";
import { SkillsWidget } from "@/components/home/SkillsWidget";
import { BuildersWidget } from "@/components/home/BuildersWidget";
import { BottlenecksWidget } from "@/components/home/BottlenecksWidget";
import { MetricsRecorder } from "@/components/analytics/MetricsRecorder";

const Index = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<HomePageData>({
    key: "home-page",
    fetcher: fetchHomePage,
    refreshInterval: 30_000,
  });

  return (
    <OrionLayout title="Comando">
      <MetricsRecorder />
      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact hideSource skeleton={<HomeSkeleton />}>
        {data && (
          <div className="space-y-5">
            {/* Tier 1: Status + Weather */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <CommandStatus data={data.command} />
              <WeatherContext />
            </div>

            {/* Tier 2: What needs attention */}
            <AttentionRequired items={data.attention} />

            {/* Tier 3: Live operations + agents */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
              <div className="xl:col-span-3">
                <LiveOperations operations={data.liveOps} />
              </div>
              <div className="xl:col-span-2">
                <AgentsHierarchy agents={data.agents} />
              </div>
            </div>

            {/* Tier 4: Context — health + bottlenecks + skills + briefing */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
              <div className="xl:col-span-2 space-y-5">
                <OperationalHealth services={data.health} />
                <BottlenecksWidget />
                <SkillsWidget />
                <BuildersWidget />
              </div>
              <div className="xl:col-span-3">
                <ExecutiveBriefing items={data.briefing} />
              </div>
            </div>
          </div>
        )}
      </OrionDataWrapper>
    </OrionLayout>
  );
};

export default Index;
