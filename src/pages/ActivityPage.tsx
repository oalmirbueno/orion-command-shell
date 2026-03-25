import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { ActivitySummary } from "@/components/activity/ActivitySummary";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

const ActivityPage = () => {
  return (
    <OrionLayout title="Atividade">
      <div className="max-w-7xl mx-auto space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Atividade"]} />
        <ActivitySummary />
        <ActivityFeed />
      </div>
    </OrionLayout>
  );
};

export default ActivityPage;
