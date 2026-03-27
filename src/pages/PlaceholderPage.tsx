import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <OrionLayout title={title}>
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", title]} />

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-6">
            <Construction className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Módulo {title}</h2>
          <p className="text-sm text-muted-foreground/50 max-w-md">
            {description || "Em desenvolvimento — módulo será disponibilizado em breve"}
          </p>
          <span className="orion-badge orion-badge-neutral mt-4">Em desenvolvimento</span>
        </div>
      </div>
    </OrionLayout>
  );
};

export default PlaceholderPage;
