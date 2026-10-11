import { ViewTransition } from "react";

/**
 * Wraps a page's content so route changes animate like iOS:
 * tab switches cross-fade and rise, drill-ins push from the right, back pops.
 * Links opt in with transitionTypes={["nav-tab" | "nav-forward" | "nav-back"]};
 * untyped transitions (router refresh after a save) don't animate.
 */
const MAP = { "nav-tab": "tab-switch", "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={MAP} exit={MAP} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
