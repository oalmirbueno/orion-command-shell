import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { AlertsSummary } from "@/components/alerts/AlertsSummary";
import { AlertsList } from "@/components/alerts/AlertsList";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchAlertsPage } from "@/domains/alerts/fetcher";
import type { AlertsPageData } from "@/domains/alerts/types";

const AlertsPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<AlertsPageData>({
    key: "alerts-page",
    fetcher: fetchAlertsPage,
  });

  return (
    <OrionLayout title="Alertas">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Alertas"]} />
        <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch}>
          {data && (
            <>
              <AlertsSummary summary={data.summary} />
              <AlertsList alerts={data.alerts} />
            </>
          )}
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default AlertsPage;
