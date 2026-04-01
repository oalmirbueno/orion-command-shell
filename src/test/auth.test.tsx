import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";

// Minimal wrapper for components needing providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("Auth system", () => {
  it("renders login page when supabase is not configured", async () => {
    const LoginPage = (await import("@/pages/LoginPage")).default;
    render(<LoginPage />, { wrapper: TestWrapper });
    expect(screen.getByText("Backend Não Configurado")).toBeInTheDocument();
  });
});
