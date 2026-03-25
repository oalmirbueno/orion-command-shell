import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { AlertsSummary } from "@/components/alerts/AlertsSummary";
import { AlertsList } from "@/components/alerts/AlertsList";

const AlertsPage = () => {
  return (
    <OrionLayout title="Alertas">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Alertas"]} />
        <AlertsSummary />
        <AlertsList />
      </div>
    </OrionLayout>
  );
};

export default AlertsPage;
