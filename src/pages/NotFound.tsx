import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { OrionLayout } from "@/components/OrionLayout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <OrionLayout title="404">
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-4">
          <div className="text-6xl font-bold text-primary/30 font-mono">404</div>
          <p className="text-sm text-muted-foreground">Página não encontrada</p>
          <p className="text-[10px] font-mono text-muted-foreground/50">
            A rota <code className="text-primary/60">{location.pathname}</code> não existe
          </p>
          <Link
            to="/"
            className="inline-block mt-4 text-xs font-mono text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-md border border-primary/20 hover:bg-primary/5"
          >
            Voltar ao Comando
          </Link>
        </div>
      </div>
    </OrionLayout>
  );
};

export default NotFound;
