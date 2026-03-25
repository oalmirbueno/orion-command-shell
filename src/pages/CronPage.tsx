import { OrionLayout } from "@/components/OrionLayout";
import { CronSummary } from "@/components/cron/CronSummary";
import { CronJobsList } from "@/components/cron/CronJobsList";

const CronPage = () => {
  return (
    <OrionLayout title="Cron">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          <span>Mission Control</span>
          <span className="text-border">/</span>
          <span className="text-foreground">Cron Jobs</span>
        </div>

        <CronSummary />
        <CronJobsList />
      </div>
    </OrionLayout>
  );
};

export default CronPage;
