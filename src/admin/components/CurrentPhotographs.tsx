import type { StaticPhoto } from "../../lib/content/staticCatalog";
import { Button } from "./Form";
import { SourceBadge, Thumb } from "./Thumb";

export function CurrentPhotographs({
  photos,
  inactive,
  onUpload,
}: {
  photos: StaticPhoto[];
  /** True when published managed photographs are live, so this set is reference-only. */
  inactive?: boolean;
  onUpload: () => void;
}) {
  return (
    <section className="max-w-4xl space-y-4">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-medium text-neutral-100">Current static fallback</h2>
          <SourceBadge source={inactive ? "fallback-inactive" : "fallback-live"} />
        </div>
        <p className="text-sm text-neutral-500">
          {inactive
            ? "Source-code photographs kept for reference. They are not on the public site — visitors see the published managed set below. You do not need to hide these one by one."
            : "What the public site renders until this project has published managed photographs. Upload below to replace this entire set; the two are never mixed."}
        </p>
      </header>

      {photos.length === 0 ? (
        <p className="text-sm text-neutral-500">
          This project is not in the static snapshot, so there is no fallback
          photograph to compare against.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo.id} className="space-y-2">
              <div
                className={`relative aspect-[4/5] overflow-hidden border bg-neutral-900 ${
                  inactive ? "border-neutral-800 opacity-55" : "border-neutral-800"
                }`}
              >
                <Thumb
                  src={photo.src}
                  alt={photo.alt}
                  width={480}
                  height={600}
                  className="size-full"
                  eager={index < 4}
                />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-1.5">
                  <span className="bg-neutral-950/75 px-1.5 py-0.5 font-mono text-[10px] text-neutral-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <SourceBadge source={inactive ? "fallback-inactive" : "fallback-live"} />
                </div>
                {index === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 bg-neutral-950/75 px-1.5 py-0.5 text-[10px] tracking-wide text-neutral-200 uppercase">
                    Cover
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-neutral-500">{photo.alt || "Untitled"}</p>
              {(photo.displayTitle || photo.displaySubtitle || photo.displayYear) && (
                <p className="truncate text-[11px] text-neutral-600">
                  {[photo.displayTitle, photo.displaySubtitle, photo.displayYear]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col items-start gap-2 border-t border-neutral-800 pt-4">
        <p className="font-mono text-xs tracking-widest text-neutral-600 uppercase">
          ↓ Managed photographs
        </p>
        <p className="text-sm text-neutral-500">
          {inactive
            ? "The public project shows only this managed set. Deleting every managed photograph restores the static fallback."
            : "Publishing managed photographs replaces the whole static fallback. Leftover Unsplash plates will not appear beside the new set."}
        </p>
        <Button onClick={onUpload}>Upload photographs</Button>
      </div>
    </section>
  );
}
