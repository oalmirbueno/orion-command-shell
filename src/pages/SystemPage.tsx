import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { SystemOverviewHeader } from "@/components/system/SystemOverviewHeader";
import { ResourceGauges } from "@/components/system/ResourceGauges";
import { ServicesTable } from "@/components/system/ServicesTable";
import { StabilitySignals } from "@/components/system/StabilitySignals";
import { UptimeTimeline } from "@/components/system/UptimeTimeline";

const SystemPage = () => {
  return (
    <OrionLayout title="Sistema">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Sistema"]} />
        <SystemOverviewHeader />
        <ResourceGauges />
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-3">
            <ServicesTable />
          </div>
          <div className="xl:col-span-2">
            <StabilitySignals />
          </div>
        </div>
        <UptimeTimeline />
      </div>
    </OrionLayout>
  );
};

export default SystemPage;
