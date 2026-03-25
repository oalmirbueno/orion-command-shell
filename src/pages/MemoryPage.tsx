import { OrionLayout } from "@/components/OrionLayout";
import { MemorySummary } from "@/components/memory/MemorySummary";
import { MemorySnapshots } from "@/components/memory/MemorySnapshots";

const MemoryPage = () => {
  return (
    <OrionLayout title="Memory">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          <span>Mission Control</span>
          <span className="text-border">/</span>
          <span className="text-foreground">Memory</span>
        </div>

        <MemorySummary />
        <MemorySnapshots />
      </div>
    </OrionLayout>
  );
};

export default MemoryPage;
