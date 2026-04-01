import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function ThrowingComponent() {
  throw new Error("Test explosion");
}

function SafeComponent() {
  return <div>Safe content</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary fallbackTitle="Erro">
        <SafeComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("renders fallback on error", () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary fallbackTitle="Erro no módulo X">
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Erro no módulo X")).toBeInTheDocument();
    expect(screen.getByText("Test explosion")).toBeInTheDocument();
    expect(screen.getByText("Tentar novamente")).toBeInTheDocument();

    spy.mockRestore();
  });
});
