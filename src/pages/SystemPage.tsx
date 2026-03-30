import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchSystemPage } from "@/domains/system/fetcher";
import { SystemOverviewHeader } from "@/components/system/SystemOverviewHeader";
import { ResourceGauges } from "@/components/system/ResourceGauges";
import { ServicesTable } from "@/components/system/ServicesTable";
import { StabilitySignals } from "@/components/system/StabilitySignals";
import { UptimeTimeline } from "@/components/system/UptimeTimeline";
import type { SystemPageData } from "@/domains/system/types";

const SystemPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<SystemPageData>({
    key: "system-page",
    fetcher: fetchSystemPage,
    refreshInterval: 60_000,
  });

  const page = data;

  return (
    <OrionLayout title="Sistema">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Sistema"]} />
        <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} emptyTitle="Dados do sistema indisponíveis" emptyDescription="Aguardando conexão com o backend de monitoramento">
          {page && (
            <>
              <SystemOverviewHeader header={page.header} />
              <div className="mt-8">
                <ResourceGauges gauges={page.gauges} />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mt-8">
                <div className="xl:col-span-3">
                  <ServicesTable services={page.services} />
                </div>
                <div className="xl:col-span-2">
                  <StabilitySignals signals={page.signals} />
                </div>
              </div>
              <div className="mt-8">
                <UptimeTimeline days={page.uptimeDays} uptimePercent={page.uptimePercent} />
              </div>
            </>
          )}
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default SystemPage;
