import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  fetchManagedContent,
  resolveSiteCopy,
  siteCopyEqual,
  staticSiteCopy,
  type SiteCopy,
} from "./siteCopy";

const SiteCopyContext = createContext<SiteCopy>(staticSiteCopy());

/**
 * Supplies resolved site copy to the public portfolio.
 *
 * The first render is the static snapshot, so there is no spinner and no layout
 * jump. A later managed overlay is applied only when it actually differs.
 */
export function SiteCopyProvider({ children }: { children: ReactNode }) {
  const [copy, setCopy] = useState<SiteCopy>(staticSiteCopy);

  useEffect(() => {
    let alive = true;
    void fetchManagedContent().then((managed) => {
      if (!alive || !managed) return;
      const next = resolveSiteCopy(managed);
      setCopy((current) => (siteCopyEqual(current, next) ? current : next));
    });
    return () => {
      alive = false;
    };
  }, []);

  return <SiteCopyContext.Provider value={copy}>{children}</SiteCopyContext.Provider>;
}

export function useSiteCopy(): SiteCopy {
  return useContext(SiteCopyContext);
}
