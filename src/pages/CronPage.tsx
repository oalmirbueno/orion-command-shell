import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { CronSummary } from "@/components/cron/CronSummary";
import { CronJobsList } from "@/components/cron/CronJobsList";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchCronPage } from "@/domains/cron/fetcher";
import type { CronPageData } from "@/domains/cron/types";

const CronPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<CronPageData>({
    key: "cron-page",
    fetcher: fetchCronPage,
  });

  const jobs = data?.jobs ?? [];
  const summary = data?.summary ?? { active: 0, healthy: 0, failed: 0, disabled: 0 };

  return (
    <OrionLayout title="Cron">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Cron Jobs"]} />
        <OrionDataWrapper
          state={state}
          source={source}
          lastUpdated={lastUpdated}
          onRetry={refetch}
          emptyTitle="Nenhum cron job configurado"
          emptyDescription="Crie um cron job para automatizar tarefas recorrentes"
        >
          <CronSummary summary={summary} />
          <CronJobsList jobs={jobs} refetchList={refetch} />
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default CronPage;
