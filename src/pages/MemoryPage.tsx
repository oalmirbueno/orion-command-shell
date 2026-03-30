import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchMemoryPage } from "@/domains/memory/fetcher";
import { MemorySummary } from "@/components/memory/MemorySummary";
import { MemorySnapshots } from "@/components/memory/MemorySnapshots";
import type { MemoryPageData } from "@/domains/memory/types";

const MemoryPage = () => {
  const { state, data, source, lastUpdated, refetch } = useOrionData<MemoryPageData>({
    key: "memory-page",
    fetcher: fetchMemoryPage,
    refreshInterval: 120_000,
  });

  const snapshots = data?.snapshots || [];
  const summary = data?.summary || null;

  return (
    <OrionLayout title="Memória">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Memória"]} />
        <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} emptyTitle="Nenhum snapshot de memória" emptyDescription="Snapshots aparecerão aqui quando agentes gravarem contexto">
          {summary && <MemorySummary summary={summary} />}
          <MemorySnapshots snapshots={snapshots} />
        </OrionDataWrapper>
      </div>
    </OrionLayout>
  );
};

export default MemoryPage;
