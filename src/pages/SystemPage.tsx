import { OrionLayout } from "@/components/OrionLayout";
import { SystemOverviewHeader } from "@/components/system/SystemOverviewHeader";
import { ResourceGauges } from "@/components/system/ResourceGauges";
import { ServicesTable } from "@/components/system/ServicesTable";
import { StabilitySignals } from "@/components/system/StabilitySignals";
import { UptimeTimeline } from "@/components/system/UptimeTimeline";

const SystemPage = () => {
  return (
    <OrionLayout title="System">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          <span>Mission Control</span>
          <span className="text-border">/</span>
          <span className="text-foreground">System</span>
        </div>

        {/* Overall system status header */}
        <SystemOverviewHeader />

        {/* Resource gauges: CPU, RAM, Disk, Uptime */}
        <ResourceGauges />

        {/* Two-column: Services + Stability */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <ServicesTable />
          </div>
          <div className="xl:col-span-2">
            <StabilitySignals />
          </div>
        </div>

        {/* Uptime timeline */}
        <UptimeTimeline />
      </div>
    </OrionLayout>
  );
};

export default SystemPage;
