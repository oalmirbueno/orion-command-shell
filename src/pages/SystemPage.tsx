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
import { RuntimeProfilesPanel } from "@/components/system/RuntimeProfilesPanel";
import { DoctorPanel } from "@/components/system/DoctorPanel";
import { SecurityPanel } from "@/components/security/SecurityPanel";
import { SystemSkeleton } from "@/components/skeletons/DomainSkeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Radio, Stethoscope, Shield } from "lucide-react";
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
      <div className="space-y-6">
        <OrionBreadcrumb items={["Mission Control", "Saúde da Infraestrutura"]} />

        <Tabs defaultValue="infra" className="space-y-4">
          <TabsList className="bg-card border border-border/30 p-1 h-auto">
            <TabsTrigger value="infra" className="text-xs font-mono data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-3 py-1.5 flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              Infraestrutura
            </TabsTrigger>
            <TabsTrigger value="profiles" className="text-xs font-mono data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-3 py-1.5 flex items-center gap-1.5">
              <Radio className="h-3 w-3" />
              Perfis de Execução
            </TabsTrigger>
            <TabsTrigger value="doctor" className="text-xs font-mono data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-3 py-1.5 flex items-center gap-1.5">
              <Stethoscope className="h-3 w-3" />
              Diagnóstico
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs font-mono data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-3 py-1.5 flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="infra" className="space-y-0 mt-0">
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
                  {/* Infra notice */}
                  <div className="rounded-lg border border-border/30 bg-surface-2/50 px-5 py-3 flex items-center gap-3 text-xs text-muted-foreground/50">
                    <span className="font-mono uppercase tracking-wider font-semibold text-muted-foreground/40">Nota</span>
                    <span>Esta página é estritamente infra/service. A trilha operacional oficial está em <a href="/activity" className="text-primary hover:underline font-medium">/activity</a>.</span>
                  </div>

                  {/* Health Banner with Subsystems */}
                  <div className="mt-4">
                    <InfraHealthBanner
                      header={page.header}
                      cronSummary={cronData?.summary ?? null}
                      serviceCount={totalServices}
                      runningServices={runningServices}
                    />
                  </div>

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
          </TabsContent>

          <TabsContent value="profiles" className="mt-0">
            <RuntimeProfilesPanel />
          </TabsContent>

          <TabsContent value="doctor" className="mt-0">
            <DoctorPanel />
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <SecurityPanel />
          </TabsContent>
        </Tabs>
      </div>
    </OrionLayout>
  );
};

export default SystemPage;
