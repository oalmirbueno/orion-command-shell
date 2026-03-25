import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { SessionsSummary } from "@/components/sessions/SessionsSummary";
import { SessionsList } from "@/components/sessions/SessionsList";

const SessionsPage = () => {
  return (
    <OrionLayout title="Sessões">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Sessões"]} />
        <SessionsSummary />
        <SessionsList />
      </div>
    </OrionLayout>
  );
};

export default SessionsPage;
