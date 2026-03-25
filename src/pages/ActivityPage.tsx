import { OrionLayout } from "@/components/OrionLayout";
import { ActivitySummary } from "@/components/activity/ActivitySummary";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

const ActivityPage = () => {
  return (
    <OrionLayout title="Activity">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          <span>Mission Control</span>
          <span className="text-border">/</span>
          <span className="text-foreground">Activity</span>
        </div>

        <ActivitySummary />
        <ActivityFeed />
      </div>
    </OrionLayout>
  );
};

export default ActivityPage;
