import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { CronSummary } from "@/components/cron/CronSummary";
import { CronJobsList } from "@/components/cron/CronJobsList";
import { useQuery } from "@tanstack/react-query";
import { fetchCronPage } from "@/domains/cron/fetcher";
import { Skeleton } from "@/components/ui/skeleton";

const CronPage = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["cron-page"],
    queryFn: async () => {
      const result = await fetchCronPage();
      return result.data;
    },
    staleTime: 30_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: false,
  });

  const jobs = data?.jobs ?? [];
  const summary = data?.summary ?? { active: 0, healthy: 0, failed: 0, disabled: 0 };

  return (
    <OrionLayout title="Cron">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Cron Jobs"]} />
        {isLoading && !data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : (
          <>
            <CronSummary summary={summary} />
            <CronJobsList jobs={jobs} refetchList={refetch} />
          </>
        )}
      </div>
    </OrionLayout>
  );
};

export default CronPage;
