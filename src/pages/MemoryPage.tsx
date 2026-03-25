import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { MemorySummary } from "@/components/memory/MemorySummary";
import { MemorySnapshots } from "@/components/memory/MemorySnapshots";

const MemoryPage = () => {
  return (
    <OrionLayout title="Memória">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Memória"]} />
        <MemorySummary />
        <MemorySnapshots />
      </div>
    </OrionLayout>
  );
};

export default MemoryPage;
