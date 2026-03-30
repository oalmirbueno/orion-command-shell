import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { routePrefetchMap } from "@/lib/routePrefetch";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    const queryClient = useQueryClient();

    const handleMouseEnter = useCallback(() => {
      const path = typeof to === "string" ? to : to.pathname ?? "";
      const prefetcher = routePrefetchMap[path];
      if (prefetcher) {
        prefetcher(queryClient);
      }
    }, [to, queryClient]);

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        onFocus={handleMouseEnter}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
