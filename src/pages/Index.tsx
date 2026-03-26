import { OrionLayout } from "@/components/OrionLayout";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchHomePage } from "@/domains/home/fetcher";
import type { HomePageData } from "@/domains/home/types";
import { CommandStatus } from "@/components/home/CommandStatus";
import { AttentionRequired } from "@/components/home/AttentionRequired";
import { LiveOperations } from "@/components/home/LiveOperations";
import { AgentsHierarchy } from "@/components/home/AgentsHierarchy";
import { OperationalHealth } from "@/components/home/OperationalHealth";
import { ExecutiveBriefing } from "@/components/home/ExecutiveBriefing";
import { WeatherContext } from "@/components/home/WeatherContext";

const Index = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<HomePageData>({
    key: "home-page",
    fetcher: fetchHomePage,
  });

  return (
    <OrionLayout title="Comando">
      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact hideSource>
        {data && (
          <div className="space-y-5">
            {/* Tier 1: Overall status */}
            <CommandStatus data={data.command} />

            {/* Context: weather — operational environment */}
            <WeatherContext />

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

            {/* Tier 4: Context — health + briefing */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
              <div className="xl:col-span-2">
                <OperationalHealth services={data.health} />
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
