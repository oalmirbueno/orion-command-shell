/**
 * Global last-updated context for the status bar.
 */
import React, { createContext, useContext, useState, useCallback } from "react";

interface LastUpdatedCtx {
  lastUpdated: Date | null;
  source: string;
  setLastUpdated: (date: Date, source?: string) => void;
}

const Ctx = createContext<LastUpdatedCtx>({
  lastUpdated: null,
  source: "",
  setLastUpdated: () => {},
});

export function LastUpdatedProvider({ children }: { children: React.ReactNode }) {
  const [lastUpdated, setLU] = useState<Date | null>(null);
  const [source, setSource] = useState("");

  const setLastUpdated = useCallback((date: Date, src = "") => {
    setLU(date);
    if (src) setSource(src);
  }, []);

  return (
    <Ctx.Provider value={{ lastUpdated, source, setLastUpdated }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLastUpdated() {
  return useContext(Ctx);
}
