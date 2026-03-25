import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
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

        <div className="orion-section-header">
          <h2 className="orion-section-label">Módulo {title}</h2>
          <span className="orion-badge orion-badge-neutral ml-2">Pendente</span>
          <div className="orion-section-divider" />
        </div>

        <div className="orion-card p-8">
          <OrionReady
            title={`Módulo ${title}`}
            description={description || "Módulo aguardando implantação — pronto para integração"}
          />
        </div>
      </div>
    </OrionLayout>
  );
};

export default PlaceholderPage;
