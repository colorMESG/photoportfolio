import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AerialImage, CorporateProject, PhotographyProject, ProjectImage } from "../../content/types";
import type { ProjectKind } from "../db/types";
import {
  fetchPublishedPortfolio,
  overlayAerial,
  overlayCorporateItem,
  overlayCorporateList,
  overlayPhotography,
  overlaysEqual,
  projectKey,
  resolveCover,
  type ManagedProject,
  type PortfolioOverlays,
} from "./portfolio";

const PortfolioContext = createContext<PortfolioOverlays>({});

/**
 * Supplies published project photographs to the public portfolio.
 *
 * The first render is the static snapshot, so there is no spinner and no layout
 * jump. A published project with managed photographs replaces the static set
 * entirely. Zero managed photographs keeps the static fallback — the two are
 * never mixed.
 */
export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [overlays, setOverlays] = useState<PortfolioOverlays>({});

  useEffect(() => {
    let alive = true;
    void fetchPublishedPortfolio().then((next) => {
      if (!alive || !next) return;
      setOverlays((current) => (overlaysEqual(current, next) ? current : next));
    });
    return () => {
      alive = false;
    };
  }, []);

  return <PortfolioContext.Provider value={overlays}>{children}</PortfolioContext.Provider>;
}

function useManaged(kind: ProjectKind, slug: string): ManagedProject | null {
  const overlays = useContext(PortfolioContext);
  return overlays[projectKey(kind, slug)] ?? null;
}

export function usePhotography(fallback: PhotographyProject): PhotographyProject {
  const managed = useManaged("photography", fallback.slug);
  return useMemo(() => overlayPhotography(fallback, managed), [fallback, managed]);
}

export function useCorporateList(slug: string, fallback: CorporateProject[]): CorporateProject[] {
  const managed = useManaged("corporate", slug);
  return useMemo(() => overlayCorporateList(fallback, managed), [fallback, managed, slug]);
}

export function useCorporate(slug: string, fallback: CorporateProject): CorporateProject {
  const managed = useManaged("corporate", slug);
  return useMemo(() => overlayCorporateItem(fallback, managed), [fallback, managed, slug]);
}

export function useAerial(slug: string, fallback: AerialImage): AerialImage {
  const managed = useManaged("flycam", slug);
  return useMemo(() => overlayAerial(fallback, managed), [fallback, managed, slug]);
}

export function useCover(
  kind: ProjectKind,
  slug: string,
  fallback?: ProjectImage
): ProjectImage | undefined {
  const managed = useManaged(kind, slug);
  return resolveCover(managed, fallback);
}
