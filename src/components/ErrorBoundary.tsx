/**
 * ErrorBoundary — Catch isolado por módulo.
 * Evita que falha em um domínio derrube o dashboard inteiro.
 */
import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
          <div className="p-3 rounded-full bg-status-warning/10">
            <AlertTriangle className="h-6 w-6 text-status-warning" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {this.props.fallbackTitle || "Erro no módulo"}
            </p>
            <p className="text-xs font-mono text-muted-foreground/50 max-w-md">
              {this.state.error?.message || "Erro inesperado"}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono bg-accent/30 text-foreground hover:bg-accent/50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
