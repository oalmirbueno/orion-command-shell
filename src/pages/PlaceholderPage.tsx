import { OrionLayout } from "@/components/OrionLayout";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <OrionLayout title={title}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          <span>Mission Control</span>
          <span className="text-border">/</span>
          <span className="text-foreground">{title}</span>
        </div>

        <div className="rounded-lg border border-border/50 bg-card p-8 min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title} Module</p>
            <p className="text-xs text-muted-foreground/50 font-mono">
              {description || "Module pending deployment..."}
            </p>
          </div>
        </div>
      </div>
    </OrionLayout>
  );
};

export default PlaceholderPage;
