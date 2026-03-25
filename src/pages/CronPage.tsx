import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { CronSummary } from "@/components/cron/CronSummary";
import { CronJobsList } from "@/components/cron/CronJobsList";

const CronPage = () => {
  return (
    <OrionLayout title="Cron">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Cron Jobs"]} />
        <CronSummary />
        <CronJobsList />
      </div>
    </OrionLayout>
  );
};

export default CronPage;
