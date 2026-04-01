import { useState, useMemo } from "react";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { ActivitySummary } from "@/components/activity/ActivitySummary";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchActivityPage } from "@/domains/activity/fetcher";
import { ActivitySkeleton } from "@/components/skeletons/DomainSkeletons";
import { AdvancedFilters, type FilterState } from "@/components/filters/AdvancedFilters";
import type { ActivityPageData, ActivityEvent } from "@/domains/activity/types";

const typeOptions = [
  { key: "all", label: "Todos" },
  { key: "agent", label: "Agente" },
  { key: "system", label: "Sistema" },
  { key: "session", label: "Sessão" },
  { key: "pipeline", label: "Pipeline" },
  { key: "security", label: "Segurança" },
];

const statusOptions = [
  { key: "all", label: "Todos" },
  { key: "critical", label: "Crítico" },
  { key: "warning", label: "Atenção" },
  { key: "success", label: "Sucesso" },
  { key: "info", label: "Info" },
];

const ActivityPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<ActivityPageData>({
    key: "activity-page",
    fetcher: fetchActivityPage,
    refreshInterval: 60_000,
  });

  const [filters, setFilters] = useState<FilterState>({
    type: "all", status: "all", dateFrom: undefined, dateTo: undefined,
  });

  const events = data?.events ?? [];

  const filtered = useMemo(() => {
    return events.filter((e: ActivityEvent) => {
      if (filters.type !== "all" && e.category !== filters.type) return false;
      if (filters.status !== "all" && e.priority !== filters.status) return false;
      if (filters.dateFrom || filters.dateTo) {
        const ts = new Date(e.time).getTime();
        if (isNaN(ts)) return true;
        if (filters.dateFrom && ts < filters.dateFrom.getTime()) return false;
        if (filters.dateTo && ts > filters.dateTo.getTime() + 86400000) return false;
      }
      return true;
    });
  }, [events, filters]);

  const summary = data?.summary ?? { total: 0, critical: 0, warning: 0, resolved: 0 };

  return (
    <OrionLayout title="Atividade">
      <div className="space-y-6">
        <OrionBreadcrumb items={["Mission Control", "Atividade"]} />
        <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} emptyTitle="Sem atividade recente" emptyDescription="Eventos aparecerão aqui quando houver atividade no sistema" skeleton={<ActivitySkeleton />}>
          <ActivitySummary summary={summary} />
          <div className="mt-5">
            <AdvancedFilters
              types={typeOptions}
              statuses={statusOptions}
              value={filters}
              onChange={setFilters}
              resultCount={filtered.length}
            />
          </div>
          <div className="mt-5">
            <ActivityFeed events={filtered} />
          </div>
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default ActivityPage;
