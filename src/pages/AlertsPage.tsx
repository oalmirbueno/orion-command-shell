import { OrionLayout } from "@/components/OrionLayout";
import { AlertsSummary } from "@/components/alerts/AlertsSummary";
import { AlertsList } from "@/components/alerts/AlertsList";

const AlertsPage = () => {
  return (
    <OrionLayout title="Alerts">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          <span>Mission Control</span>
          <span className="text-border">/</span>
          <span className="text-foreground">Alerts</span>
        </div>

        <AlertsSummary />
        <AlertsList />
      </div>
    </OrionLayout>
  );
};

export default AlertsPage;
