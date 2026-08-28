import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AerialImage, CorporateProject, PhotographyProject, ProjectImage } from "../../content/types";
import type { ProjectKind } from "../db/types";
import {
  fetchPublishedPortfolio,
  isHiddenKey,
  overlayAerial,
  overlayCorporateItem,
  overlayCorporateList,
  overlayPhotography,
  projectKey,
  resolveCover,
  snapshotEqual,
  type ManagedProject,
  type PortfolioSnapshot,
} from "./portfolio";

const EMPTY: PortfolioSnapshot = { overlays: {}, hiddenKeys: [] };

const PortfolioContext = createContext<PortfolioSnapshot>(EMPTY);

/**
 * Supplies published project photographs and hidden-slug tombstones.
 *
 * The first render is the static snapshot, so there is no spinner. After mount:
 *   hidden → the public section/plate is omitted
 *   published managed photographs → that set only
 *   otherwise → static fallback
 */
export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot>(EMPTY);

  useEffect(() => {
    let alive = true;
    void fetchPublishedPortfolio().then((next) => {
      if (!alive || !next) return;
      setSnapshot((current) => (snapshotEqual(current, next) ? current : next));
    });
    return () => {
      alive = false;
    };
  }, []);

  return <PortfolioContext.Provider value={snapshot}>{children}</PortfolioContext.Provider>;
}

function useSnapshot(): PortfolioSnapshot {
  return useContext(PortfolioContext);
}

function useManaged(kind: ProjectKind, slug: string): ManagedProject | null {
  const { overlays } = useSnapshot();
  return overlays[projectKey(kind, slug)] ?? null;
}

function useHidden(kind: ProjectKind, slug: string): boolean {
  return isHiddenKey(useSnapshot().hiddenKeys, kind, slug);
}

export function usePhotography(fallback: PhotographyProject): PhotographyProject | null {
  const hidden = useHidden("photography", fallback.slug);
  const managed = useManaged("photography", fallback.slug);
  return useMemo(
    () => (hidden ? null : overlayPhotography(fallback, managed)),
    [fallback, hidden, managed]
  );
}

export function useCorporateList(slug: string, fallback: CorporateProject[]): CorporateProject[] {
  const hidden = useHidden("corporate", slug);
  const managed = useManaged("corporate", slug);
  return useMemo(
    () => (hidden ? [] : overlayCorporateList(fallback, managed)),
    [fallback, hidden, managed, slug]
  );
}

export function useCorporate(slug: string, fallback: CorporateProject): CorporateProject | null {
  const hidden = useHidden("corporate", slug);
  const managed = useManaged("corporate", slug);
  return useMemo(
    () => (hidden ? null : overlayCorporateItem(fallback, managed)),
    [fallback, hidden, managed, slug]
  );
}

export function useAerial(slug: string, fallback: AerialImage): AerialImage | null {
  const hidden = useHidden("flycam", slug);
  const managed = useManaged("flycam", slug);
  return useMemo(
    () => (hidden ? null : overlayAerial(fallback, managed)),
    [fallback, hidden, managed, slug]
  );
}

export function useCover(
  kind: ProjectKind,
  slug: string,
  fallback?: ProjectImage
): ProjectImage | undefined {
  const hidden = useHidden(kind, slug);
  const managed = useManaged(kind, slug);
  if (hidden) return undefined;
  return resolveCover(managed, fallback);
}
