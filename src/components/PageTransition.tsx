import { useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const prevKey = useRef(location.key);

  useEffect(() => {
    if (location.key !== prevKey.current) {
      prevKey.current = location.key;
      setVisible(false);
      // Trigger reflow then fade in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    }
  }, [location.key]);

  return (
    <div
      className={cn(
        "transition-opacity duration-150 ease-out",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      {children}
    </div>
  );
}
