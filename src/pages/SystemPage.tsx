import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchSystemPage } from "@/domains/system/fetcher";
import { fetchCronPage } from "@/domains/cron/fetcher";
import { InfraHealthBanner } from "@/components/system/InfraHealthBanner";
import { ResourceGauges } from "@/components/system/ResourceGauges";
import { ServicesTable } from "@/components/system/ServicesTable";
import { StabilitySignals } from "@/components/system/StabilitySignals";
import { UptimeTimeline } from "@/components/system/UptimeTimeline";
import { CronHealthPanel } from "@/components/system/CronHealthPanel";
import { SystemSkeleton } from "@/components/skeletons/DomainSkeletons";
import type { SystemPageData } from "@/domains/system/types";
import type { CronPageData } from "@/domains/cron/types";

const SystemPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<SystemPageData>({
    key: "system-page",
    fetcher: fetchSystemPage,
    refreshInterval: 60_000,
  });

  const { data: cronData } = useOrionData<CronPageData>({
    key: "cron-health",
    fetcher: fetchCronPage,
    refreshInterval: 60_000,
  });

  const page = data;

  const runningServices = page?.services?.filter(s => s.status === "running").length ?? 0;
  const totalServices = page?.services?.length ?? 0;

  return (
    <OrionLayout title="Infraestrutura">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Saúde da Infraestrutura"]} />
        <OrionDataWrapper
          state={state}
          source={source}
          lastUpdated={lastUpdated}
          onRetry={refetch}
          emptyTitle="Dados do sistema indisponíveis"
          emptyDescription="Aguardando conexão com o backend de monitoramento"
          skeleton={<SystemSkeleton />}
        >
          {page && (
            <>
              {/* Health Banner with Subsystems */}
              <InfraHealthBanner
                header={page.header}
                cronSummary={cronData?.summary ?? null}
                serviceCount={totalServices}
                runningServices={runningServices}
              />

              {/* Resource Gauges */}
              <div className="mt-8">
                <ResourceGauges gauges={page.gauges} />
              </div>

              {/* Services + Stability + Cron Health */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
                <ServicesTable services={page.services} />
                {cronData && cronData.jobs.length > 0 ? (
                  <CronHealthPanel jobs={cronData.jobs} summary={cronData.summary} />
                ) : (
                  <StabilitySignals signals={page.signals} />
                )}
              </div>

              {/* If we have cron AND stability, show stability below */}
              {cronData && cronData.jobs.length > 0 && page.signals.length > 0 && (
                <div className="mt-8">
                  <StabilitySignals signals={page.signals} />
                </div>
              )}

              {/* Uptime */}
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
