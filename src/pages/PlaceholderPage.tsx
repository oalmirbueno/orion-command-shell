import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb, OrionSectionHeader, OrionBadge } from "@/components/orion";
import { OrionReady } from "@/components/orion";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <OrionLayout title={title}>
      <div className="max-w-7xl mx-auto space-y-8">
        <OrionBreadcrumb items={["Mission Control", title]} />

        <OrionSectionHeader
          label={`${title} Module`}
          badge={{ text: "Pending", variant: "neutral" }}
        />

        <div className="orion-card p-8">
          <OrionReady
            title={`${title} Module`}
            description={description || "Module pending deployment — ready for integration"}
          />
        </div>
      </div>
    </OrionLayout>
  );
};

export default PlaceholderPage;
