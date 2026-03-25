import { OrionLayout } from "@/components/OrionLayout";
import { SessionsSummary } from "@/components/sessions/SessionsSummary";
import { SessionsList } from "@/components/sessions/SessionsList";

const SessionsPage = () => {
  return (
    <OrionLayout title="Sessions">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          <span>Mission Control</span>
          <span className="text-border">/</span>
          <span className="text-foreground">Sessions</span>
        </div>

        <SessionsSummary />
        <SessionsList />
      </div>
    </OrionLayout>
  );
};

export default SessionsPage;
