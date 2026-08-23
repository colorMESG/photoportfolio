import { staticGalleryPhotos } from "../../lib/content/staticCatalog";
import { PageHeader } from "../components/PageHeader";
import { SourceBadge, Thumb } from "../components/Thumb";

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        title="Personal Gallery"
        description="Photographs currently on the public Personal Gallery. Managed uploads arrive in a later phase."
      />

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-neutral-200">Current website photographs</h2>
          <SourceBadge source="static-current" />
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {staticGalleryPhotos.map((photo, index) => (
            <li key={photo.id} className="space-y-2">
              <div className="relative aspect-[4/5] overflow-hidden border border-neutral-800 bg-neutral-900">
                <Thumb
                  src={photo.src}
                  alt={photo.alt}
                  width={480}
                  height={600}
                  className="size-full"
                />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-1.5">
                  <span className="bg-neutral-950/75 px-1.5 py-0.5 font-mono text-[10px] text-neutral-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <SourceBadge source="static" />
                </div>
              </div>
              <p className="truncate text-xs text-neutral-400">{photo.alt}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 space-y-2 border-t border-neutral-800 pt-8">
        <h2 className="text-sm font-medium text-neutral-200">Managed photographs</h2>
        <p className="text-sm text-neutral-500">No managed photographs yet.</p>
        <p className="text-xs text-neutral-600">
          Static plates stay read-only. When gallery uploads exist they will use
          the same drag handle and <code>reorder_gallery_images</code> helper as
          project photographs — nothing here is written to Supabase today.
        </p>
      </section>
    </>
  );
}
