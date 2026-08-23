import type { StaticPhoto } from "../../lib/content/staticCatalog";
import { Button } from "./Form";
import { SourceBadge, Thumb } from "./Thumb";

export function CurrentPhotographs({
  photos,
  onUpload,
}: {
  photos: StaticPhoto[];
  onUpload: () => void;
}) {
  return (
    <section className="max-w-4xl space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-medium text-neutral-100">Current website photographs</h2>
        <p className="text-sm text-neutral-500">
          What the public portfolio still renders. These stay as static
          placeholders until you replace them with managed uploads below.
        </p>
      </header>

      {photos.length === 0 ? (
        <p className="text-sm text-neutral-500">
          This project is not on the public site yet, so there is no static
          photograph to compare against.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo.id} className="space-y-2">
              <div className="relative aspect-[4/5] overflow-hidden border border-neutral-800 bg-neutral-900">
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
                  <SourceBadge source="static" />
                </div>
                {index === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 bg-neutral-950/75 px-1.5 py-0.5 text-[10px] tracking-wide text-neutral-200 uppercase">
                    Cover
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-neutral-500">{photo.alt || "Untitled"}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col items-start gap-2 border-t border-neutral-800 pt-4">
        <p className="font-mono text-xs tracking-widest text-neutral-600 uppercase">
          ↓ Replace
        </p>
        <p className="text-sm text-neutral-500">
          Upload the real photographs below. They will not overwrite these
          placeholders until the public site is switched over.
        </p>
        <Button onClick={onUpload}>Upload photographs</Button>
      </div>
    </section>
  );
}
