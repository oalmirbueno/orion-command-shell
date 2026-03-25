import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OperationsKanban } from "@/components/operations/OperationsKanban";
import { OperationsTimeline } from "@/components/operations/OperationsTimeline";

const OperationsPage = () => {
  return (
    <OrionLayout title="Operações">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <OrionBreadcrumb items={["Mission Control", "Operações"]} />
        <OperationsKanban />
        <OperationsTimeline />
      </div>
    </OrionLayout>
  );
};

export default OperationsPage;
